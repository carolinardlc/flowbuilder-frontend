import Link from "next/link";
import Layout from "../../../components/Layout";
import WorkflowDetailsCanvas from "./_components/WorkflowDetailsCanvas";

type WorkflowsDetailProps = {
  params: Promise<{ id: string }>;
};

export default async function WorkflowsDetail({
  params,
}: WorkflowsDetailProps) {
  const { id } = await params;

  return (
    <Layout fullWidth>
      <section className="hero">
        <div>
          <p className="hero-kicker">Workflows / {id}</p>
          <h1 className="workflows-title">Detalle de workflow</h1>
          <p className="workflows-subtitle">
            Vista de solo lectura con resumen y conexiones del flujo.
          </p>
        </div>

        <WorkflowDetailsCanvas workflowId={id} />

        <div className="workflow-actions">
          <Link href={`/workflows/${id}`} className="btn-primary link-button">
            Volver al canvas
          </Link>
        </div>
      </section>
    </Layout>
  );
}
