# Resumen del Proyecto: reporteador-angular

## 1. Objetivo

Aplicación de reporting/dashboard para la plataforma **Pecuarios** (medio agropecuario). Visualiza estadísticas de tráfico web, perfiles de visitantes, banners, campañas de email (Mailchimp), productos, artículos, noticias, eventos, videos y usuarios registrados. Soporta 3 divisiones: **Porcicultura** (1), **Ganadería** (2), **Avicultura** (3).

- **API Backend:** `https://api-sandbox.pecuarios.com/reports/`
- **Angular:** 14.1.0 (NgModule-based, NO standalone)
- **TypeScript:** 4.7.2

---

## 2. Arquitectura General

- **Patrón:** NgModule tradicional con lazy loading por feature module
- **Layout:** `AppLayoutComponent` como shell para rutas autenticadas (header + sidebar + breadcrumb + router-outlet + footer). Solo `/login` no usa este layout.
- **Servicio único:** `GeneralService` maneja TODA la comunicación HTTP (10 endpoints)
- **Sin state management:** Estado en componentes, `localStorage` y cookies
- **Comunicación entre componentes:** `EventEmitter` en el servicio (`$isMenuOpen`)
- **Formularios:** Todos template-driven (FormsModule + ngModel), NO hay reactive forms

### Estructura de directorios
```
src/app/
├── componentes/          # Componentes compartidos (layout, charts, etc.)
├── guards/               # LoginGuard
├── interceptors/         # JwtInterceptor (no registrado)
├── interfaces/           # 22 interfaces TypeScript
├── pages/                # 12 feature modules (lazy-loaded)
├── pipes/                # SafeUrlPipePipe
├── services/             # GeneralService (único)
├── app-routing.module.ts
└── app.module.ts
```

---

## 3. Rutas

| Ruta | Módulo Lazy | Guard | Estado |
|---|---|---|---|
| `login` | LoginModule | Ninguno | Activo |
| `datos-generales-de-la-marca` | DatosGeneralesModule | LoginGuard | Activo |
| `campanias` | CampaniasModule | LoginGuard | Activo |
| `banners` | BannersModule | LoginGuard | Activo |
| `productos` | ProductosModule | LoginGuard | Activo |
| `articulos` | ArticulosModule | LoginGuard | Activo |
| `micrositio` | MicrositioModule | LoginGuard | Activo |
| `usuarios-registrados` | UsuarioRegistradosModule | LoginGuard | Activo |
| `noticias` | NoticiasModule | LoginGuard | Activo |
| `eventos` | EventosModule | LoginGuard | Activo |
| `videos` | VideosModule | LoginGuard | Activo |
| `estadisticas-del-sitio` | EstadisticasDelSitioModule | LoginGuard | **COMENTADO** |
| `**` | Redirect a `login` | — | Activo |

Cada módulo lazy define un child route `''` que renderiza su componente.

---

## 4. Flujo de Carga de la Aplicación

1. `main.ts` → bootstrap `AppModule`
2. `AppModule` importa `BrowserModule`, `HttpClientModule`, `ComponentesModule`, `CookieService`
3. `AppRoutingModule` define rutas lazy con `loadChildren`
4. Usuario navega → Angular resuelve la ruta lazy → carga el módulo feature
5. `AppLayoutComponent` renderiza header + sidebar + breadcrumb + `<router-outlet>`
6. El componente hijo (page) se renderiza dentro del layout
7. Cada page inyecta `GeneralService` y hace llamadas HTTP al backend

---

## 5. Autenticación

- **Login:** POST a `/login` con `email`, `password`, `division` (FormData)
- **Token:** Se almacena en cookie `token` (ngx-cookie-service)
- **Datos de sesión en localStorage:** `usuario`, `nombre_usuario`, `empresa`, `foto`, `nombre_empresa`
- **JwtInterceptor:** EXISTE pero **NO está registrado** en HttpInterceptorProviders. Las llamadas HTTP se envían sin header Authorization.
- **LoginGuard:** Verifica cookie `token`. **Bug:** siempre retorna `true` aunque redirija a `/login`.
- **Logout:** `HeaderComponent.cerrarSesion()` limpia localStorage, borra todas las cookies, redirige a `/login`

---

## 6. Servicios

### GeneralService (`src/app/services/general.service.ts`)

| Método | HTTP | Endpoint | Usado por |
|---|---|---|---|
| `loginCMS(email, password)` | POST | `login` | LoginComponent |
| `visitasXseccion(div, emp, tipo, ...)` | GET | `total-visits/{div}/{emp}/{tipo}/...` | DatosGenerales |
| `perfilVisitante(div, emp, ...)` | GET | `visitor-profile/{div}/{emp}/...` | DatosGenerales + pages de secciones |
| `ultimasVisitas(div, emp, ...)` | GET | `last-visits/{div}/{emp}/...` | DatosGenerales |
| `mailchimp(div, emp, ...)` | GET | `mailchimp/{div}/{emp}/...` | Campanias |
| `banners(div, emp, ...)` | GET | `banners/{div}/{emp}/...` | Banners |
| `secciones(div, emp, tipo, ...)` | GET | `visits/{div}/{emp}/{tipo}/...` | Productos, Artículos, Micrositio, Noticias, Eventos, Videos |
| `site(div, ...)` | GET | `stats-site/{div}/...` | EstadisticasDelSitio |
| `users(div, ...)` | GET | `users/{div}/...` | UsuarioRegistrados |
| `name(id)` | GET | `name-enterprise/{id}` | Login, Header, MenuLateral |

**Propiedades especiales:**
- `$isMenuOpen: EventEmitter<boolean>` — toggle del sidebar
- `$fecha_inicio / $fecha_fin` — fechas compartidas entre componentes
- `fechaActual(anio_anterior)` — helper de fechas

---

## 7. APIs Utilizadas

Todas bajo `https://api-sandbox.pecuarios.com/reports/`:

| Endpoint | Método | Descripción |
|---|---|---|
| `login` | POST | Autenticación |
| `total-visits/{div}/{emp}/{tipo}/[{fi}/{ff}]` | GET | Visitas por sección |
| `visitor-profile/{div}/{emp}/[{fi}/{ff}]` | GET | Perfil demográfico |
| `last-visits/{div}/{emp}/[{ff}]` | GET | Últimas visitas |
| `mailchimp/{div}/{emp}/{fi}/{ff}` | GET | Campañas email |
| `banners/{div}/{emp}/{fi}/{ff}` | GET | Estadísticas banners |
| `visits/{div}/{emp}/{tipo}/{fi}/{ff}` | GET | Stats por sección |
| `stats-site/{div}/[{fi}/{ff}]` | GET | Stats del sitio |
| `users/{div}/[{fi}/{ff}]` | GET | Usuarios registrados |
| `name-enterprise/{id}` | GET | Nombre de empresa |

Parámetros: `div`=división, `emp`=empresa, `tipo`=categoría, `fi`=fecha inicio, `ff`=fecha fin.

---

## 8. Componentes Principales

### Componentes Compartidos (componentes/)

| Componente | Selector | Función |
|---|---|---|
| `AppLayoutComponent` | `app-app-layout` | Shell del layout autenticado |
| `HeaderComponent` | `app-header` | Barra superior con logo, usuario, logout |
| `MenuLateralComponent` | `app-menu-lateral` | Sidebar con navegación |
| `FooterComponent` | `app-footer` | Pie de página |
| `GraficaGeneralComponent` | `app-grafica-general` | Wrapper Highcharts (line/pie) |
| `GraficaMapasComponent` | `app-grafica-mapas` | Google GeoChart (mapa mundial) |

### Páginas (pages/)

| Página | API Used | Funcionalidad Clave |
|---|---|---|
| **Login** | `loginCMS`, `name` | Form login, guarda token+session |
| **Datos Generales** | `visitasXseccion` x8, `perfilVisitante`, `ultimasVisitas` | Dashboard principal: 8 gráficas de líneas, perfil visitantes, últimas visitas |
| **Campañas** | `mailchimp` | Tabla campañas Mailchimp con búsqueda |
| **Banners** | `banners` | Tabla banners con categorías (nuevos/antiguos/super/otros/app) |
| **Productos** | `secciones` | Gráfica + tabla productos con perfil visitantes |
| **Artículos** | `secciones` | Gráfica + tabla artículos con perfil visitantes |
| **Micrositio** | `secciones` | Gráfica + tabla micrositio con perfil visitantes |
| **Noticias** | `secciones` | Gráfica + tabla noticias con perfil visitantes |
| **Eventos** | `secciones` | Gráfica + tabla eventos con perfil visitantes |
| **Videos** | `secciones` | Gráfica + tabla videos con perfil visitantes |
| **Usuarios Registrados** | `users` | 3 gráficas pie + DataTables con filtros |
| **Estadísticas del Sitio** | `site` | Stats globales + mapa geográfico (**deshabilitado**) |

---

## 9. Estado y Almacenamiento

| Mecanismo | Qué almacena |
|---|---|
| **Cookie `token`** | JWT de autenticación |
| **localStorage** | `usuario`, `nombre_usuario`, `empresa`, `foto`, `nombre_empresa` |
| **Propiedades del servicio** | `$isMenuOpen`, `$fecha_inicio`, `$fecha_fin` |
| **Propiedades de componente** | Datos de API, flags de loading, datos de gráficas |

No hay NgRx, Akita, ni ningún state management library.

---

## 10. Dependencias Externas

| Paquete | Versión | Uso |
|---|---|---|
| `@angular/*` | ^14.1.0 | Framework core |
| `highcharts` | ^11.4.3 | Gráficas de líneas y pie |
| `highcharts-angular` | ^3.0.0 | Wrapper Angular para Highcharts |
| `angular-datatables` | ^14.0.0 | Tablas paginadas (solo Usuarios) |
| `datatables.net` | 1.12.1 | Core DataTables |
| `datatables.net-responsive` | 2.3.0 | Tablas responsivas |
| `jquery` | ^3.6.1 | Dependencia de DataTables |
| `ngx-cookie-service` | ^14.0.1 | Manejo de cookies |
| `rxjs` | ~7.5.0 | Programación reactiva |
| Google Charts | (dinámico) | GeoChart para mapas |
| Font Awesome | (CSS) | Iconos en sidebar/header |

---

## 11. Configuración por Ambiente

### environment.ts (Desarrollo)
```typescript
production: false
api: 'https://api-sandbox.pecuarios.com/reports/'
division: 2              // Ganadería
nombre_dominio: 'Ganaderia.com'
nombre_sitio: 'Ganaderia'
```

### environment.prod.ts (Producción)
```typescript
production: true
api: 'https://api-sandbox.pecuarios.com/reports/'  // ← MISMA URL sandbox
division: 1              // Porcicultura
nombre_dominio: 'Porcicultura.com'
nombre_sitio: 'Porcicultura'
```

**Nota:** Producción apunta al mismo sandbox. Hay bloques comentados para las 3 divisiones en ambos archivos.

---

## 12. Reglas de Negocio

- Cada división (Porcicultura/Ganadería/Avicultura) tiene su propio logo y favicon
- El `division` ID se envía en el login y en cada llamada GET como path parameter
- Las fechas se envían como path parameters (`YYYY-MM-DD`), no como query params
- La edad se calcula desde fecha de nacimiento restando años
- Los banners inactivos se marcan si `fecha_fin < hoy`
- Los productos/artículos se filtran por `estatus == 1` (activos)
- Los perfiles de visitantes combinan datos de género x edad (suma de porcentajes hombre+mujer por rango)
- Los top-países y top-ocupaciones muestran los 7 principales + "Otros"
- La búsqueda en tablas es 100% client-side (filtro por nombre)

---

## 13. Funcionalidades Especiales

- **8 gráficas Highcharts** en Datos Generales (una por sección del sitio)
- **Gráficas de pie variable** para distribución país/ocupación/edad en Usuarios
- **Google GeoChart** para visualización geográfica (deshabilitado)
- **DataTables** solo en Usuarios Registrados con filtros dependientes (país → estado → ocupación)
- **Pipe SafeUrlPipe** para bypass de sanitización de estilos dinámicos (barras de progreso)
- **Exportación a PDF** vía `window.print()` con estilos `_print.scss`
- **Sidebar responsive** con modo colapsado (60px) y tooltips
- **Manejo de 3 divisiones** con logos, favicons y configuración por ambiente

---

## 14. Problemas Conocidos

1. **LoginGuard bug:** Siempre retorna `true` aunque redirija a `/login` — la ruta se activa
2. **JwtInterceptor no registrado:** Existe pero no se provee en `HttpInterceptorProviders` — las llamadas HTTP van sin Authorization header
3. **Producción apunta a sandbox:** `environment.prod.ts` usa la misma URL de desarrollo
4. **Código duplicado masivo:** Cálculo de edades, barras de progreso de perfil, sección de filtro de fechas, y búsqueda están copiados en 7+ componentes
5. **Valores hardcodeados:** Conteo de vistas en Noticias/Eventos/Videos = "1,009", última actualización de Banners = "10/03/2021"
6. **API key de Google Maps hardcodeada** en GraficaMapasComponent
7. **Ruta `estadisticas-del-sitio` comentada** pero el módulo existe
8. **jQuery cargado globalmente** en angular.json (patrón no ideal para Angular)
9. **Sin manejo de errores UI** en la mayoría de llamadas API (fallos silenciosos)
10. **Sin paginación** en tablas de contenido (solo Usuarios usa DataTables)

---

## 15. Qué debe conservar el Nuevo Proyecto

- **Todas las interfaces TypeScript** (`general.interface.ts`) — 22 modelos de datos
- **Lógica de negocio:** cálculo de edades, perfiles de visitantes, aggregaciones de top-7 + "Otros"
- **Configuración de ambientes** (mejorada con URLs de producción reales)
- **Regla de 3 divisiones** (logos, favicons, configuración)
- **Endpoints API** y patrón REST con path parameters
- **Componentes de chart:** wrapping de Highcharts (line y variable-pie)
- **Pipe SafeUrlPipe**
- **Estilos SCSS** (variables, fuentes, estructura de página, tablas, impresión)
- **Funcionalidad de exportación a PDF** (`window.print()`)
- **Flujo de autenticación** (login → cookie token → guard)
- **Lazy loading** por feature module

---

## 16. Qué NO debe Migrarse

- **LoginGuard con bug** (corregir al migrar)
- **JwtInterceptor sin registrar** (integrar correctamente)
- **Código duplicado** de cálculos de edad, perfil de visitantes, filtros de fecha (refactorizar en servicios/pipes/utilidades compartidos)
- **jQuery + DataTables como dependencias globales** (usar alternativa Angular pura o instalar solo donde se necesita)
- **Google GeoChart** (dependencia de script externo hardcodeado, considerar alternativa)
- **Valores hardcodeados** ("1,009", "10/03/2021")
- **API key de Google Maps** hardcodeada
- **GeneralService monolítico** (splittear en servicios por dominio: AuthService, VisitsService, BannersService, etc.)
- **EventEmitter en el servicio** para comunicación entre componentes (usar patrón más robusto)
- **Manejo de estado en localStorage** sin centralización
- **Template-driven forms** sin validación (considerar migrar a reactive forms)
- **SCSS de jQuery/DataTables** que ya no se necesite
