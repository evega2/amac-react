import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const navigate = useNavigate()
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function iniciarSesion(evento) {
    evento.preventDefault()
    const datos = new FormData(evento.currentTarget)
    setMensaje('')
    setEnviando(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: datos.get('correo'),
        password: datos.get('contrasena'),
      })
      if (error) {
        setMensaje('Correo o contraseña incorrectos.')
        return
      }
      navigate('/')
    } catch {
      setMensaje('No se pudo iniciar sesión. Inténtalo de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="panel">
      <h1>Iniciar sesión</h1>
      <form className="formulario" onSubmit={iniciarSesion}>
        <label htmlFor="correo">Correo</label>
        <input id="correo" name="correo" type="email" autoComplete="email" required />
        <label htmlFor="contrasena">Contraseña</label>
        <input id="contrasena" name="contrasena" type="password" autoComplete="current-password" required />
        <button className="boton" disabled={enviando}>Iniciar sesión</button>
        {mensaje && <p role="alert">{mensaje}</p>}
      </form>
    </section>
  )
}