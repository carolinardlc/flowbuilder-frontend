import Link from "next/link";
import Layout from "./components/Layout";

export default function Home() {
  return (
    <Layout>
      <div className="hero">
        <div>
          <p className="hero-kicker">Flujos a tu manera</p>
          <h1 className="hero-title">
            Diseña workflows con una vibra retro y suave.
          </h1>
          <p className="hero-text">
            FlowBuilder te ayuda a mapear procesos con claridad. Todo vive en un
            lienzo ordenado, con tarjetas limpias y un estilo noventero que hace
            que cada paso se sienta ligero.
          </p>
        </div>

        <div className="cta-row">
          <Link href="/workflows" className="btn-primary link-button">
            Crear workflow
          </Link>
          <Link href="/workflows" className="btn-secondary link-button">Ver ejemplos</Link>
        </div>

        <div className="feature-grid">
          {[
            {
              title: "Inicio claro",
              text: "Plantillas suaves para empezar sin friccion.",
            },
            {
              title: "Colaboracion",
              text: "Comparte avances y recibe feedback en vivo.",
            },
            {
              title: "Modo presentacion",
              text: "Muestra tus flujos con un look retro moderno.",
            },
          ].map((item) => (
            <div key={item.title} className="feature-card">
              <h3 className="feature-title">{item.title}</h3>
              <p className="feature-text">{item.text}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
