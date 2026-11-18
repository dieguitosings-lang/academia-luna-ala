# Academia Luna Ala - MDT-2025-006

Capacitación de 40 horas (23/11/2026 al 18/12/2026) para el personal y directorio de la Etapa Luna Ala, VillaClub.
Cada trabajador estudia desde su celular. Todas las evidencias (inicio y fin de cada sesión, minutos reales, notas, actividades, foro, asistencia) se guardan en una hoja de Google Sheets.

## Archivos
- `index.html`: la plataforma (lo que abren los trabajadores).
- `config.js`: aquí se pega la dirección del servidor de Google.
- `apps-script/Code.gs`: el código que recibe y guarda los datos en la hoja.

## Instalación (una sola vez, unos 20 minutos)

### Parte 1. La hoja de Google y el servidor
1. Entra a Google Sheets con la cuenta que será dueña de los registros y crea una hoja nueva llamada **Evidencias Capacitación Luna Ala 2026**.
2. Menú **Extensiones > Apps Script**. Borra el código que aparece y pega todo el contenido de `apps-script/Code.gs`. Pulsa el icono de guardar.
3. Arriba elige la función **setup** y pulsa **Ejecutar**. Google pedirá permisos: acepta. Si sale "Google no verificó esta app", pulsa **Configuración avanzada > Ir a (nombre del proyecto)**. Al terminar, vuelve a la hoja: verás las pestañas Usuarios, Sesiones, Lecciones, Evaluaciones, Actividades, Foro, Asistencia, Config y **Resumen**.
4. **Implementar > Nueva implementación**. En el engranaje elige **Aplicación web**. En "Ejecutar como" pon **Yo** y en "Quién tiene acceso" pon **Cualquier persona**. Pulsa Implementar y **copia la URL** (termina en `/exec`).
5. Si algún día cambias `Code.gs`, debes hacer **Implementar > Administrar implementaciones > editar > Nueva versión**; si no, los cambios no se aplican.

### Parte 2. GitHub
1. En github.com crea un repositorio (por ejemplo `academia-luna-ala`). Debe ser **público** para usar GitHub Pages gratis.
2. Abre `config.js` y pega la URL del paso anterior entre las comillas: `apiUrl: "https://script.google.com/macros/s/.../exec"`.
3. Sube los archivos al repositorio: **Add file > Upload files** (index.html, config.js, README.md y la carpeta apps-script). Pulsa Commit.
4. **Settings > Pages**: en "Source" elige **Deploy from a branch**, rama **main**, carpeta **/(root)**. Guarda. En 1 o 2 minutos aparece el enlace: `https://TU-USUARIO.github.io/academia-luna-ala/`. Ese enlace se les da a los trabajadores.

### Parte 3. Primer uso
1. Abre el enlace. Como no hay Administrador aún, aparece el botón **Crear cuenta del Administrador**: lo hace el Lcdo. Carlos Arteaga.
2. Cada trabajador abre el enlace en su celular, pulsa **Registrarme** y elige su cargo.
3. Carlos entra, abre **Panel de control** y cambia el rol de Jazmín Ávila a *contadora* y el de Diego Montalvo a *presidente*.
4. Comparte la hoja de Google con Jazmín y Carlos (Compartir). La pestaña **Resumen** muestra horas, avance y estado de cada persona.
5. Carlos entra a **Configuración de videos** y activa solo los videos que haya verificado.

## Antes del 23/11/2026
- Haz una prueba real con 1 o 2 personas de prueba. Después **borra esas filas de la hoja** (todas las pestañas) para que no queden en el reporte.
- Abrir el enlace con `#demo` al final (`.../academia-luna-ala/#demo`) es un ensayo local que NO se conecta a Google Sheets y reduce el tiempo mínimo a 1 minuto.

## Cosas que debes saber
- El servidor guarda la hora en que RECIBE cada dato, además de la hora del celular. Ese dato extra ayuda como evidencia.
- El servidor rechaza sesiones que digan haber durado más que el tiempo transcurrido entre su inicio y su fin.
- Aun así, el cronómetro corre en el celular de cada trabajador: no es infalible. Mantén también el **acta de asistencia diaria firmada** (se imprime desde el Panel de control).
- Las contraseñas se guardan como código (hash), no en texto. Quien tenga acceso de edición a la hoja o al Apps Script puede ver y modificar los datos: no compartas la hoja con permiso de edición a más gente de la necesaria.
- La plataforma intenta consultar tu IP pública en api.ipify.org al iniciar sesión. Si falla, queda "no disponible".
- Si un trabajador pierde internet, el avance se guarda en su celular y se envía al volver la conexión. No debe cerrar sesión ni borrar datos del navegador hasta ver "✔ Guardado en Google Sheets".
- Apps Script tiene límites de uso diario de Google. Para unas 10 a 20 personas alcanza de sobra.
