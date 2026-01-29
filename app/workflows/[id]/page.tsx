import Link from "next/link";
import Layout from "../../components/Layout";
import ReactFlowCanvas from "./canvas/ReactFlowCanvas_FINAL"; // Versión final limpia y estable

type WorkflowsDetailProps = {
  params: { id: string };
};

export default function WorkflowsDetail({ params }: WorkflowsDetailProps) {
  return (
    <Layout>
      <section className="canvas-shell">
        <ReactFlowCanvas
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
