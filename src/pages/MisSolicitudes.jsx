import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabase'

export default function MisSolicitudes() {
  const { sesion } = useAuth()
  const candidatoId = sesion?.user.id
  const [resultado, setResultado] = useState(null)

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

  return (
    <section className="panel">
      <h1>Mis solicitudes</h1>
      {!resultado ? <p role="status">Cargando…</p>
        : resultado.error ? <p role="alert">No se pudieron cargar las solicitudes.</p>
        : resultado.filas.length === 0 ? <p>No tienes solicitudes.</p>
        : resultado.filas.map((solicitud) => (
          <article className="tarjeta" key={solicitud.id}>
            <h2>{solicitud.vacante?.titulo ?? 'Vacante'}</h2>
            <p>Empresa: {solicitud.vacante?.empresa?.nombre ?? 'No disponible'}</p>
            <p>Fecha: {new Date(solicitud.creada_en).toLocaleDateString('es-MX')}</p>
            <p>Estado: {solicitud.estatus}</p>
          </article>
        ))}
    </section>
  )
}