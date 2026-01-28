import Link from "next/link";
import Layout from "../../../components/Layout";

type WorkflowsDetailProps = {
  params: { id: string };
};

export default function WorkflowsDetail({ params }: WorkflowsDetailProps) {
  return (
    <Layout>
      <section className="hero">
        <div>
          <p className="hero-kicker">Workflows / {params.id}</p>
          <h1 className="workflows-title">Detalle de workflow</h1>
          <p className="workflows-subtitle">
            Aqui ira el canvas del workflow. (Placeholder)
          </p>
        </div>

        <div className="workflow-card">
          <h2 className="feature-title">Canvas en construccion</h2>
          <p className="feature-text">
            Este espacio mostrara pasos, tareas y conexiones del flujo.
          </p>
          <div className="workflow-actions">
            <Link
              href={`/workflows/${params.id}`}
              className="btn-primary link-button"
            >
              Volver al canvas
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
