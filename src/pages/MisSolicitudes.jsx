import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabase'

export default function MisSolicitudes() {
  const { sesion } = useAuth()
  const candidatoId = sesion?.user.id
  const [resultado, setResultado] = useState(null)
  const [mensaje, setMensaje] = useState('')
  const [cancelando, setCancelando] = useState(false)

  useEffect(() => {
    if (!candidatoId) return
    let activo = true
    supabase.from('solicitudes')
      .select('id, estatus, creada_en, vacante:vacantes(titulo, empresa:perfiles(nombre))')
      .eq('candidato_id', candidatoId)
      .order('creada_en', { ascending: false })
      .then(({ data, error }) => {
        if (activo) setResultado({ filas: data ?? [], error: Boolean(error) })
      })
    return () => { activo = false }
  }, [candidatoId])

    async function cancelar(id) {
    if (!window.confirm('¿Cancelar esta solicitud?')) return
    setMensaje('')
    setCancelando(true)
    try {
      const { error } = await supabase.from('solicitudes')
        .update({ estatus: 'Cancelada' })
        .eq('id', id)
        .eq('candidato_id', candidatoId)
        .in('estatus', ['Enviada', 'En revisión'])
        .select('id').single()
      if (error) throw error
      setResultado((actual) => ({
        ...actual,
        filas: actual.filas.map((fila) =>
          fila.id === id ? { ...fila, estatus: 'Cancelada' } : fila
        ),
      }))
      setMensaje('Solicitud cancelada.')
    } catch {
      setMensaje('No se pudo cancelar. Actualiza la página y revisa el estatus.')
    } finally {
      setCancelando(false)
    }
  }

  return (
    <section className="panel">
      <h1>Mis solicitudes</h1>
      {mensaje && <p role="status">{mensaje}</p>}
      {!resultado ? <p role="status">Cargando…</p>
        : resultado.error ? <p role="alert">No se pudieron cargar las solicitudes.</p>
        : resultado.filas.length === 0 ? <p>No tienes solicitudes.</p>
        : resultado.filas.map((solicitud) => (
          <article className="tarjeta" key={solicitud.id}>
            <h2>{solicitud.vacante?.titulo ?? 'Vacante'}</h2>
            <p>Empresa: {solicitud.vacante?.empresa?.nombre ?? 'No disponible'}</p>
            <p>Fecha: {new Date(solicitud.creada_en).toLocaleDateString('es-MX')}</p>
            <p>Estado: {solicitud.estatus}</p>
            {['Enviada', 'En revisión'].includes(solicitud.estatus) && (
              <button type="button" className="boton boton-peligro" disabled={cancelando}
                onClick={() => cancelar(solicitud.id)}>
                Cancelar solicitud
              </button>
            )}
          </article>
        ))}
    </section>
  )
}