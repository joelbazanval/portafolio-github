# Portafolio Joel Bazán

Sitio estático. Tú solo llenas carpetas; `build.js` las lee y genera `content.json`.

## Carpetas

| Carpeta | Qué pones |
|---|---|
| `portadas-album/` | Solo imágenes. El nombre del archivo es el título. |
| `personajes/` | Solo imágenes. |
| `videoclips/` `visualizers/` `reels/` | Un `enlaces.txt` + imágenes opcionales. |
| `blog/` | Una carpeta por post. |

### redes/
`redes.txt`, una línea por red: `TikTok | https://www.tiktok.com/@tuusuario`. Para un icono propio pon una imagen con el mismo nombre (`TikTok.svg`). Sin imagen, TikTok, Instagram y YouTube usan su icono; otras redes usan un icono de link.

**Orden:** pon un número delante (`01-Nombre`, `02-Nombre`). El número no se muestra.

### enlaces.txt (videoclips, visualizers, reels)
Una línea por obra: `Título | URL | subtexto opcional`. Acepta YouTube, Instagram y TikTok.
```
Mi videoclip | https://youtu.be/XXXXXXXXXXX | Nombre del artista
```
Miniatura, en este orden de prioridad:
1. Carpeta con el mismo nombre del título y fotos `1.jpg`, `2.jpg`, `3.jpg`… → pasan solas como un gif.
2. Imagen con el mismo nombre del título (`Mi videoclip.jpg`) → miniatura fija.
3. Si no hay nada y es YouTube → usa la miniatura de YouTube.

### blog/
```
blog/01-Mi post/
  post.md        ← texto en Markdown
  imagen1.jpg    ← las imágenes de la carpeta
  imagen2.jpg
```
En `post.md`: la primera línea `# Título` es el título. Todo Markdown funciona (negrita, listas, citas, links, tablas, código). Para poner una imagen escribe `{{imagen1}}` (el nombre del archivo sin extensión). Las imágenes de la carpeta también forman la vista previa animada.

## Publicar en GitHub (gratis)
1. Crea un repositorio y sube todo el contenido de esta carpeta (incluida `.github`).
2. En el repo: **Settings → Pages → Source: GitHub Actions**.
3. Cada vez que hagas *commit* a `main`, se reconstruye y publica solo (1–2 min).

Probar en tu PC (Node 20+): abre la terminal de VS Code y ejecuta `node watch.js`. Se queda vigilando: cada vez que guardes un texto o imagen regenera `content.json` y Live Server recarga solo. Sin eso, usa `node build.js` a mano cada vez.

## Espacio y videos
- **No subas videos a GitHub** (archivos de máx. 100 MB y el sitio de ~1 GB). Sube los videos a YouTube (puede ser "no listado") y pega el link.
- Sube imágenes ligeras: JPG o WebP de ~1200 px y menos de 300 KB.
- Si algún video no debe estar en YouTube, súbelo a Cloudflare R2 o Vimeo.
