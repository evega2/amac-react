import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabase'

export default function PublicarVacante() {
  const { sesion } = useAuth()
  const [porTelefono, setPorTelefono] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [guardando, setGuardando] = useState(false)

  async function publicar(evento) {
    evento.preventDefault()
    const campos = new FormData(evento.currentTarget)
    setMensaje('')
    setGuardando(true)
    try {
      const { error } = await supabase.from('vacantes').insert({
        empresa_id: sesion.user.id,
        titulo: campos.get('titulo').trim(),
        sueldo: Number(campos.get('sueldo')),
        ubicacion: campos.get('ubicacion').trim(),
        horario: campos.get('horario'),
        categoria: campos.get('categoria').trim(),
        descripcion: campos.get('descripcion').trim(),
        requisitos: campos.get('requisitos').trim(),
        prestaciones: campos.get('prestaciones').trim(),
        telefono_contacto: porTelefono ? campos.get('telefono').trim() : null,
      })
      if (error) throw error
      window.location.assign('/')
    } catch {
      setMensaje('No se pudo publicar la vacante.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <section className="panel">
      <h1>Publicar vacante</h1>
      <form className="formulario" onSubmit={publicar}>
        <label>Título <input name="titulo" required /></label>
        <label>Sueldo mensual (MXN) <input name="sueldo" type="number" min="0.01" step="0.01" required /></label>
        <label>Ubicación <input name="ubicacion" required /></label>
        <label>Horario
          <select name="horario" defaultValue="" required>
            <option value="" disabled>Selecciona un horario</option>
            <option>Matutino</option>
            <option>Vespertino</option>
            <option>Medio tiempo</option>
            <option>Fines de semana</option>
          </select>
        </label>
        <label>Categoría <input name="categoria" required /></label>
        <label>Descripción <textarea name="descripcion" required /></label>
        <label>Requisitos <textarea name="requisitos" required /></label>
        <label>Prestaciones <textarea name="prestaciones" required /></label>
        <label>
          <input type="checkbox" checked={porTelefono}
            onChange={(evento) => setPorTelefono(evento.target.checked)} />
          Recibir postulaciones por teléfono
        </label>
        {porTelefono && <label>Teléfono de contacto <input name="telefono" type="tel" required /></label>}
        <button type="submit" className="boton" disabled={guardando}>Publicar</button>
        {mensaje && <p role="alert">{mensaje}</p>}
      </form>
    </section>
  )
}