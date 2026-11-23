FROM debian:bookworm-slim AS build

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl git xz-utils unzip zip libglu1-mesa \
    && rm -rf /var/lib/apt/lists/*

ARG FLUTTER_VERSION=3.44.8
RUN curl -fsSL "https://storage.googleapis.com/flutter_infra_release/releases/stable/linux/flutter_linux_${FLUTTER_VERSION}-stable.tar.xz" \
    | tar -xJ -C /opt
ENV PATH="/opt/flutter/bin:${PATH}"
RUN git config --global --add safe.directory /opt/flutter && flutter config --enable-web

WORKDIR /app
COPY pubspec.yaml pubspec.lock ./
RUN flutter pub get
COPY lib/ ./lib/
COPY assets/ ./assets/
COPY web/ ./web/

# La app Flutter carga .env como asset. Solo contiene URL y clave pública local.
ARG BROTA_SUPABASE_URL
ARG BROTA_SUPABASE_ANON_KEY
ARG BROTA_API_URL
RUN test -n "$BROTA_SUPABASE_URL" && test -n "$BROTA_SUPABASE_ANON_KEY" && test -n "$BROTA_API_URL" \
    && printf 'SUPABASE_URL=%s\nSUPABASE_ANON_KEY=%s\nAPI_BASE_URL=%s\n' \
      "$BROTA_SUPABASE_URL" "$BROTA_SUPABASE_ANON_KEY" "$BROTA_API_URL" > .env \
    && flutter build web --release

FROM nginx:1.27-alpine
COPY --from=build /app/build/web /usr/share/nginx/html
COPY --from=build /app/build/web/index.html /usr/share/nginx/html/404.html
EXPOSE 80
