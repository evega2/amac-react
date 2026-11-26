import { useEffect, useState } from 'react'
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Login from './pages/Login.jsx'
import Registro from './pages/Registro.jsx'
import { useAuth } from './context/AuthContext.jsx'
import MisSolicitudes from './pages/MisSolicitudes.jsx'
import RutaProtegida from './components/RutaProtegida.jsx'
import SolicitudesRecibidas from './pages/SolicitudesRecibidas.jsx'

const pesos = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

function DatosVacante({ vacante }) {
  return (
    <>
      <p><strong>Sueldo:</strong> {pesos.format(vacante.sueldo)} MXN al mes</p>
      <p><strong>Ubicación:</strong> {vacante.ubicacion}</p>
      <p><strong>Horario:</strong> {vacante.horario}</p>
      <p><strong>Categoría:</strong> {vacante.categoria}</p>
    </>
  )
}

function DetalleVacante({ vacantes }) {
  const { id } = useParams()
  const { sesion, perfil } = useAuth()
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)
  const vacante = vacantes.find((item) => String(item.id) === id)
  if (!vacante) return <p>Esta vacante no está disponible. <Link to="/">Volver al listado</Link></p>
  async function postularme() {
    setMensaje('')
    setEnviando(true)
    try {
      const { error } = await supabase.from('solicitudes').insert({
        vacante_id: vacante.id,
        candidato_id: sesion.user.id,
      })
      if (error?.code === '23505') setMensaje('Ya te postulaste a esta vacante.')
      else if (error) setMensaje('No se pudo enviar la solicitud.')
      else setMensaje('¡Listo! Tu solicitud fue enviada.')
    } catch {
      setMensaje('No se pudo enviar la solicitud.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <section className="panel">
      <h1>{vacante.titulo}</h1>
      <DatosVacante vacante={vacante} />
      <h2>Descripción</h2><p>{vacante.descripcion}</p>
      <h2>Requisitos</h2><p>{vacante.requisitos}</p>
      <h2>Prestaciones</h2><p>{vacante.prestaciones}</p>
      <div className="acciones">
        {!sesion && <Link to="/login">Inicia sesión para postularte</Link>}
        {perfil?.rol === 'candidato' && (
          perfil.aprobado ? (
            <button type="button" className="boton" onClick={postularme} disabled={enviando}>
              Postularme
            </button>
          ) : <p>Tu registro aún no ha sido aprobado por AMAC.</p>
        )}
        {mensaje && <p role="status">{mensaje}</p>}
        {vacante.telefono_contacto && (
          <a className="boton" href={`tel:${vacante.telefono_contacto}`}>Llamar</a>
        )}
        <Link className="boton boton-secundario" to="/">Volver al listado</Link>
      </div>
    </section>
  )
}

function ListadoVacantes({ vacantes }) {
  const [busqueda, setBusqueda] = useState('')
  const [horario, setHorario] = useState('')
  const texto = busqueda.trim().toLocaleLowerCase('es-MX')
  const horarios = [...new Set(vacantes.map((vacante) => vacante.horario))].sort()
  const resultados = vacantes.filter((vacante) =>
    [vacante.titulo, vacante.ubicacion].some((dato) => dato.toLocaleLowerCase('es-MX').includes(texto)) &&
    (!horario || vacante.horario === horario)
  )

  return (
    <section className="panel">
      <h1>Listado de vacantes</h1>
      <form className="filtros" role="search" onSubmit={(event) => event.preventDefault()}>
        <div>
          <label htmlFor="busqueda">Buscar por puesto o ubicación</label>
          <input id="busqueda" type="search" value={busqueda} onChange={(event) => setBusqueda(event.target.value)} />
        </div>
        <div>
          <label htmlFor="horario">Horario</label>
          <select id="horario" value={horario} onChange={(event) => setHorario(event.target.value)}>
            <option value="">Todos los horarios</option>
            {horarios.map((opcion) => <option key={opcion}>{opcion}</option>)}
          </select>
        </div>
      </form>
      {resultados.length === 0 && <p role="status">No hay vacantes para mostrar.</p>}
      <div className="vacantes">
        {resultados.map((vacante) => (
          <article className="tarjeta" key={vacante.id}>
            <h2>{vacante.titulo}</h2>
            <DatosVacante vacante={vacante} />
            <Link className="boton" to={`/vacantes/${vacante.id}`}>Ver vacante: {vacante.titulo}</Link>
          </article>
        ))}
      </div>
    </section>
  )
}

export default function App() {
  const { sesion } = useAuth()
  const navigate = useNavigate()

  async function cerrarSesion() {
    const { error } = await supabase.auth.signOut()
    if (error) {
      window.alert('No se pudo cerrar sesión. Inténtalo de nuevo.')
      return
    }
    navigate('/')
  }
  const [resultado, setResultado] = useState(null)

  useEffect(() => {
    if (!supabase) return
    let activo = true
    async function cargar() {
      try {
        const { data, error } = await supabase
          .from('vacantes')
          .select('id,titulo,sueldo,ubicacion,horario,categoria,descripcion,requisitos,prestaciones,telefono_contacto')
          .eq('estado', 'activa')
          .order('creada_en', { ascending: false })
        if (activo) setResultado({ vacantes: data ?? [], error: Boolean(error) })
      } catch {
        if (activo) setResultado({ vacantes: [], error: true })
      }
    }
    cargar()
    return () => { activo = false }
  }, [])

  return (
    <>
      <a className="saltar-contenido" href="#principal">Saltar al contenido</a>
      <header className="encabezado contenedor">
        <Link className="nombre-sitio" to="/">AMAC · Bolsa de trabajo</Link>
        {sesion ? (
          <button type="button" className="boton" onClick={cerrarSesion}>
            Cerrar sesión
          </button>
        ) : (
          <Link to="/login">Iniciar sesión</Link>
        )}
      </header>
      <main id="principal" className="contenedor" tabIndex={-1}>
        {!supabase ? <p role="alert">Falta configurar la conexión con Supabase.</p>
          : !resultado ? <p role="status">Cargando vacantes…</p>
          : resultado.error ? <p role="alert">No se pudieron cargar las vacantes.</p>
          : <Routes>
              <Route path="/empresa/solicitudes" element={<RutaProtegida rol="empresa"><SolicitudesRecibidas /></RutaProtegida>} />
              <Route path="/mis-solicitudes" element={<RutaProtegida rol="candidato"><MisSolicitudes /></RutaProtegida>} />
              <Route path="/login" element={<Login />} />
              <Route path="/registro" element={<Registro />} />
              <Route path="/empresa/registro" element={<Registro rol="empresa" />} />
              <Route path="/" element={<ListadoVacantes vacantes={resultado.vacantes} />} />
              <Route path="/vacantes/:id" element={<DetalleVacante vacantes={resultado.vacantes} />} />
              <Route path="*" element={<p>Página no encontrada. <Link to="/">Volver al listado</Link></p>} />
            </Routes>}
      </main>
    </>
  )
}
