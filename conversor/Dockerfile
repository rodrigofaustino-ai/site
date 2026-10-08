FROM debian:bookworm-slim
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       python3 libreoffice-writer fonts-liberation2 fonts-crosextra-carlito \
       fonts-crosextra-caladea ca-certificates fontconfig \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --uid 10001 converter
WORKDIR /app
COPY --chown=converter:converter server.py /app/server.py
USER converter
ENV PORT=8080
EXPOSE 8080
CMD ["python3", "/app/server.py"]
