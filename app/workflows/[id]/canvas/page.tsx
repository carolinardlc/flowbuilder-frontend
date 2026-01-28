import Link from "next/link";
import Layout from "../../../components/Layout";
import WorkflowCanvas from "../_components/WorkflowCanvas";

type CanvasPageProps = {
  params: { id: string };
};

export default function CanvasPage({ params }: CanvasPageProps) {
  return (
    <Layout>
      <section className="canvas-shell">
        <WorkflowCanvas
          workflowId={params.id}
          actions={
            <>
              <Link
                href={`/workflows/${params.id}/details`}
                className="btn-secondary link-button"
              >
                Detalles
              </Link>
              <Link href="/workflows" className="btn-secondary link-button">
                Volver a workflows
              </Link>
            </>
          }
        />
      </section>
    </Layout>
  );
}
