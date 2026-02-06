import Link from "next/link";
import Layout from "../../../components/Layout";
import WorkflowCanvas from "../_components/WorkflowCanvas";

type CanvasPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CanvasPage({ params }: CanvasPageProps) {
  const { id } = await params;
  return (
    <Layout fullWidth>
      <section className="canvas-shell">
        <WorkflowCanvas
          workflowId={id}
          actions={
            <>
              <Link
                href={`/workflows/${id}/details`}
                className="btn-secondary link-button"
              >
                Detalles
              </Link>
              <Link href="/workflows" className="btn-secondary link-button">
                &lt; Volver a workflows
              </Link>
            </>
          }
        />
      </section>
    </Layout>
  );
}
