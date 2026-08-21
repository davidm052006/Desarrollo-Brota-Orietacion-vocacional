# Migraciones históricas

Estos `migration_*.sql` ya se corrieron contra la base real de Brota en
Supabase, uno por uno, a medida que se agregaba cada feature. Se
consolidaron en agosto 2026 en un solo script (`backend/setup_database.sql`,
actualizado para reflejar el esquema completo actual) — para levantar un
proyecto Supabase nuevo desde cero alcanza con correr ese archivo, no hace
falta tocar nada de acá.

Esta carpeta se conserva solo como registro histórico de qué se corrió y
cuándo (útil si hay que entender por qué una tabla quedó como quedó). No
hay que volver a ejecutar ninguno de estos, ni por separado ni en orden.
