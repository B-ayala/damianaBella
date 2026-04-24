# Reglas globales de frontend (NO HACER)

Estas reglas son obligatorias para cualquier código generado o modificado. Su incumplimiento introduce problemas de rendimiento, accesibilidad y UX.

## ❌ Accesibilidad (CRÍTICO)

* NO crear botones (<button>) sin nombre accesible
* NO usar botones vacíos o solo con íconos sin soporte accesible
* NO omitir atributos accesibles cuando el contenido no es visible (ej: botones de íconos)
* NO usar elementos interactivos sin semántica correcta

## ❌ Imágenes y layout (CLS)

* NO usar <img> sin atributos explícitos width y height
* NO renderizar imágenes sin reservar espacio en el layout
* NO generar cambios de tamaño dinámicos que afecten el layout durante la carga
* NO insertar contenido que provoque layout shifts inesperados

## ❌ Performance (LCP)

* NO lazy-load de la imagen principal (LCP)
* NO retrasar la carga de elementos críticos visibles above-the-fold
* NO ocultar recursos críticos detrás de lógica innecesaria
* NO hacer que recursos importantes se descubran tarde en el DOM

## ❌ JavaScript y bundles

* NO importar librerías completas si no se usan completamente
* NO incluir código no utilizado en bundles
* NO cargar módulos pesados en el inicio si no son necesarios
* NO romper lazy loading de módulos

## ❌ Animaciones

* NO animar propiedades que afectan layout:

  * NO usar: top, bottom, left, right, width, height
  * NO usar: visibility como animación
* NO generar animaciones que causen layout shift o jank

## ❌ Render blocking

* NO bloquear el render inicial con recursos innecesarios
* NO incluir CSS o JS no crítico en el path inicial

## ❌ Cache

* NO usar configuraciones que impidan cache eficiente
* NO generar recursos sin estrategia de cache

## ❌ Contraste y UI

* NO usar combinaciones de colores con bajo contraste
* NO comprometer legibilidad del texto
* NO usar estilos que dificulten la lectura

## ❌ Third-party

* NO abusar de librerías externas innecesarias
* NO cargar scripts de terceros sin evaluar impacto en performance

## 🎯 Objetivo obligatorio

Todo código generado debe:

* Minimizar CLS (< 0.1)
* Optimizar LCP (< 2.5s)
* Mantener accesibilidad (WCAG AA o superior)
* Evitar degradación de performance
* Seguir buenas prácticas modernas de frontend

Si una solución rompe alguna de estas reglas, debe ser rechazada.
