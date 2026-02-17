

# Mover Rendimiento Omnicanal al tope del Dashboard

## Cambio

Reordenar las secciones en `src/components/Dashboard.tsx` para que `OmnichannelPerformance` sea el primer bloque visible despues del subtitulo de bienvenida.

### Orden actual:
1. Subtitulo de bienvenida
2. AI Agents (AgentCards)
3. Digital Ecosystem (Websites)
4. **Omnichannel Performance** (linea 137)
5. Smart Alerts
6. Widget Grid (Goals, Activity, Connectivity)

### Orden nuevo:
1. Subtitulo de bienvenida
2. **Omnichannel Performance** (movido aqui)
3. AI Agents (AgentCards)
4. Digital Ecosystem (Websites)
5. Smart Alerts
6. Widget Grid (Goals, Activity, Connectivity)

## Archivo afectado

| Archivo | Accion |
|---------|--------|
| `src/components/Dashboard.tsx` | Mover la linea `{user && <OmnichannelPerformance />}` de la posicion actual (linea 137) a justo despues del parrafo de subtitulo (linea 89) |

## Detalle tecnico

Solo se mueve una linea de JSX. No hay cambios en imports, logica ni estilos.
