import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabase'

export default function SolicitudesRecibidas() {
  const { sesion } = useAuth()
  const empresaId = sesion?.user.id
  const [filas, setFilas] = useState(null)
  const [mensaje, setMensaje] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (!empresaId) return
    let activo = true
    supabase.from('solicitudes')
      .select('id, estatus, vacante:vacantes!inner(titulo, empresa_id), candidato:perfiles(nombre, edad, colonia, experiencia)')
      .eq('vacante.empresa_id', empresaId)
      .neq('estatus', 'Cancelada')
      .order('creada_en', { ascending: false })
      .then(({ data, error }) => {
        if (!activo) return
        if (error) setMensaje('No se pudieron cargar las solicitudes.')
        else setFilas(data ?? [])
      })
    return () => { activo = false }
  }, [empresaId])

  async function cambiarEstatus(id, estatus) {
    setMensaje('')
    setGuardando(true)
    try {
      const { data, error } = await supabase.from('solicitudes')
        .update({ estatus }).eq('id', id).select('id, estatus').single()
      if (error) throw error
      setFilas((actuales) => actuales.map((fila) =>
        fila.id === id ? { ...fila, estatus: data.estatus } : fila
      ))
      setMensaje('Estatus actualizado.')
    } catch {
      setMensaje('No se pudo actualizar el estatus.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <section className="panel">
      <h1>Solicitudes recibidas</h1>
      {mensaje && <p role="status">{mensaje}</p>}
      {!filas && !mensaje && <p role="status">Cargando…</p>}
      {filas?.length === 0 && <p>No hay solicitudes recibidas.</p>}
      {filas?.map(({ id, estatus, candidato, vacante }) => (
        <article key={id} className="tarjeta">
          <h2>{candidato?.nombre ?? 'Candidato'}</h2>
          <p>Vacante: {vacante.titulo}</p>
          <p>Edad: {candidato?.edad ?? 'No indicada'}</p>
          <p>Colonia: {candidato?.colonia ?? 'No indicada'}</p>
          <p>Experiencia: {candidato?.experiencia ?? 'No indicada'}</p>
          <label>
            Estatus
            <select value={estatus} disabled={guardando}
              onChange={(evento) => cambiarEstatus(id, evento.target.value)}>
              <option value="Enviada" disabled>Enviada</option>
              <option>En revisión</option>
              <option>Aceptada</option>
              <option>Rechazada</option>
            </select>
          </label>
        </article>
      ))}
    </section>
  )
}