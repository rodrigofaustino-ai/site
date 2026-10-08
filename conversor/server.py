"""Conversor DOCX/PDF privado, com LibreOffice. Sem dependências Python externas."""
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path, PurePosixPath
import hmac
import io
import json
import os
import shutil
import signal
import subprocess
import tempfile
import threading
import zipfile
import xml.etree.ElementTree as ET

MAX_BYTES = 4 * 1024 * 1024
MAX_EXPANDED_BYTES = 40 * 1024 * 1024
TIMEOUT = 45
SLOTS = threading.BoundedSemaphore(1)
TOKEN = os.environ.get('DOCX_CONVERTER_TOKEN', '')
SOFFICE = os.environ.get('SOFFICE_BIN', 'soffice')


def validate_docx(data):
    try:
        with zipfile.ZipFile(io.BytesIO(data)) as package:
            items = package.infolist()
            if len(items) > 5000 or sum(item.file_size for item in items) > MAX_EXPANDED_BYTES:
                raise ValueError('Documento excede o limite descompactado.')
            names = set(package.namelist())
            if '[Content_Types].xml' not in names or 'word/document.xml' not in names:
                raise ValueError('O arquivo não é um DOCX válido.')
            for item in items:
                path = PurePosixPath(item.filename)
                if path.is_absolute() or '..' in path.parts or 'vbaproject' in item.filename.lower():
                    raise ValueError('Conteúdo não permitido no documento.')
                if item.filename.endswith('.rels'):
                    relationships = ET.fromstring(package.read(item))
                    for relation in relationships:
                        if relation.get('TargetMode', '').lower() == 'external' and not relation.get('Type', '').endswith('/hyperlink'):
                            raise ValueError('Incorpore imagens e recursos externos antes de converter.')
            ET.fromstring(package.read('word/document.xml'))
    except (zipfile.BadZipFile, ET.ParseError, KeyError, RuntimeError) as error:
        raise ValueError('O arquivo não é um DOCX válido.') from error


def convert_docx(data):
    validate_docx(data)
    # Cada processo tem seu próprio perfil; arquivos são eliminados no sucesso e na falha.
    with tempfile.TemporaryDirectory(prefix='srm-pdf-') as temp:
        directory = Path(temp)
        source = directory / 'documento.docx'
        source.write_bytes(data)
        profile = (directory / 'perfil').as_uri()
        env = os.environ.copy()
        env['XDG_CACHE_HOME'] = str(directory / 'cache')
        process = subprocess.Popen(
            [SOFFICE, '-env:UserInstallation=' + profile, '--headless', '--nologo',
             '--nodefault', '--nofirststartwizard', '--convert-to', 'pdf:writer_pdf_Export',
             '--outdir', str(directory), str(source)],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, env=env, start_new_session=True,
        )
        try:
            process.communicate(timeout=TIMEOUT)
        except subprocess.TimeoutExpired:
            try:
                os.killpg(process.pid, signal.SIGKILL)
            except ProcessLookupError:
                pass
            process.communicate()
            raise
        output = directory / 'documento.pdf'
        if process.returncode != 0 or not output.is_file():
            raise RuntimeError('O LibreOffice não conseguiu converter este documento.')
        pdf = output.read_bytes()
        if not pdf.startswith(b'%PDF-') or len(pdf) > MAX_BYTES:
            raise RuntimeError('PDF inválido ou maior que o limite de 4 MB.')
        return pdf


class Handler(BaseHTTPRequestHandler):
    server_version = 'SRMConverter'

    def log_message(self, format, *args):
        # Não registrar documentos, nomes dos alunos, cabeçalhos nem tokens.
        return

    def reply(self, status, data, content_type='application/json; charset=utf-8'):
        if isinstance(data, dict):
            data = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if self.path == '/health':
            return self.reply(200, {'status': 'ok'})
        self.reply(404, {'error': 'Rota não encontrada.'})

    def do_POST(self):
        if self.path != '/convert':
            return self.reply(404, {'error': 'Rota não encontrada.'})
        supplied = self.headers.get('Authorization', '')
        if not TOKEN or not hmac.compare_digest(supplied.encode(), ('Bearer ' + TOKEN).encode()):
            return self.reply(401, {'error': 'Não autorizado.'})
        try:
            length = int(self.headers.get('Content-Length', '0'))
        except ValueError:
            return self.reply(400, {'error': 'Tamanho inválido.'})
        if length <= 0 or length > MAX_BYTES:
            return self.reply(413, {'error': 'O DOCX deve ter entre 1 byte e 4 MB.'})
        if not SLOTS.acquire(blocking=False):
            return self.reply(503, {'error': 'Conversor ocupado. Tente novamente em instantes.'})
        try:
            self.connection.settimeout(20)
            data = self.rfile.read(length)
            if len(data) != length:
                return self.reply(400, {'error': 'Documento incompleto.'})
            self.reply(200, convert_docx(data), 'application/pdf')
        except ValueError as error:
            self.reply(400, {'error': str(error)})
        except subprocess.TimeoutExpired:
            self.reply(504, {'error': 'A conversão excedeu o tempo disponível.'})
        except (RuntimeError, OSError):
            self.reply(502, {'error': 'Não foi possível converter o DOCX em PDF.'})
        finally:
            SLOTS.release()


def main():
    if len(TOKEN) < 32:
        raise SystemExit('Configure DOCX_CONVERTER_TOKEN com pelo menos 32 caracteres.')
    if not shutil.which(SOFFICE):
        raise SystemExit('LibreOffice não encontrado. Instale-o ou configure SOFFICE_BIN.')
    server = ThreadingHTTPServer(('0.0.0.0', int(os.environ.get('PORT', '8080'))), Handler)
    server.daemon_threads = True
    print('Conversor SRM iniciado.', flush=True)
    server.serve_forever()


if __name__ == '__main__':
    main()
