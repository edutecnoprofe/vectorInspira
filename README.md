# Extensión Chrome: Guardar Imágenes con Tags

Extensión personal para guardar imágenes de internet con tags personalizados y organizarlas en una galería.

## Instalación

1. Abre Chrome y ve a `chrome://extensions/`
2. Activa "Modo de desarrollador" (arriba a la derecha)
3. Haz click en "Cargar extensión sin empaquetar"
4. Selecciona la carpeta del proyecto

## Uso

### Guardar una imagen
1. Click derecho en cualquier imagen web
2. Selecciona "Guardar imagen con tags"
3. Se abre un popup:
   - Selecciona tags existentes (si los hay)
   - O escribe un nuevo tag y presiona Enter
   - Click "Guardar"

### Ver galería
1. Click en el icono de la extensión (esquina superior derecha del navegador)
2. Se abre la galería en una tab nueva
3. Ver todas las imágenes guardadas
4. Filtrar por tags usando los checkboxes
5. Click en una imagen para ver detalles:
   - Ver imagen grande
   - Editar tags
   - Eliminar imagen

## Estructura

```
.
├── manifest.json          # Configuración de la extensión
├── background.js          # Service worker (context menu, manejo de tabs)
├── icons/
│   └── icon128.png       # Icono de la extensión
├── popup/
│   ├── popup.html        # UI para agregar tags
│   ├── popup.js
│   └── popup.css
├── gallery/
│   ├── gallery.html      # Página principal de la galería
│   ├── gallery.js
│   └── gallery.css
├── utils/
│   └── db.js            # Funciones IndexedDB
└── README.md
```

## Almacenamiento

Las imágenes se guardan localmente en IndexedDB (sin límite de tamaño, solo en tu navegador, perfil actual).

## Notas

- No es una extensión publicada, solo para uso personal
- Los datos NO se sincronizan entre navegadores o perfiles
- Las imágenes se guardan como blobs en la DB del navegador
- Puedes tener múltiples tags por imagen
- El filtro usa lógica AND (si seleccionas 2 tags, muestra solo imágenes con ambos)
