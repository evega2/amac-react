import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Registro({ rol = 'candidato' }) {
  const empresa = rol === 'empresa'
  const navigate = useNavigate()
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function registrar(evento) {
    evento.preventDefault()
    const campos = new FormData(evento.currentTarget)
    const perfil = {
      rol,
      nombre: campos.get('nombre'),
      telefono: campos.get('telefono'),
      ...(empresa
        ? { giro: campos.get('giro') }
        : {
            edad: Number(campos.get('edad')),
            colonia: campos.get('colonia'),
            experiencia: campos.get('experiencia'),
          }),
    }

    setMensaje('')
    setEnviando(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: campos.get('correo'),
        password: campos.get('contrasena'),
        options: { data: perfil },
      })
      if (error) setMensaje(error.message)
      else if (data.session) navigate('/')
      else setMensaje('Revisa tu correo para confirmar el registro.')
    } catch {
      setMensaje('No se pudo completar el registro. Inténtalo de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="panel">
      <h1>{empresa ? 'Registro de empresa' : 'Registro de candidato'}</h1>
      <form className="formulario" onSubmit={registrar}>
        <label>{empresa ? 'Nombre de la empresa' : 'Nombre completo'} <input name="nombre" required /></label>
        <label>Correo <input name="correo" type="email" autoComplete="email" required /></label>
        <label>Contraseña <input name="contrasena" type="password" autoComplete="new-password" minLength={6} required /></label>
        <label>Teléfono <input name="telefono" type="tel" required /></label>
        {empresa ? (
          <label>Giro <input name="giro" required /></label>
        ) : (
          <>
            <label>Edad <input name="edad" type="number" min={18} max={120} required /></label>
            <label>Colonia <input name="colonia" required /></label>
            <label>Experiencia <textarea name="experiencia" required /></label>
            <label><input type="checkbox" required /> Acepto los términos y condiciones</label>
          </>
        )}
        <button className="boton" disabled={enviando}>Crear cuenta</button>
        {mensaje && <p role="status">{mensaje}</p>}
      </form>
    </section>
  )
}