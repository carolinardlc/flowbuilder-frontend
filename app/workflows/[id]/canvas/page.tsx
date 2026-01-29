import Link from "next/link";
import Layout from "../../../components/Layout";
import ReactFlowCanvas from "./ReactFlowCanvas_FINAL";

type CanvasPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CanvasPage({ params }: CanvasPageProps) {
  const { id } = await params;

  return (
    <Layout>
      <section className="canvas-shell">
        <ReactFlowCanvas
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
                Volver a workflows
              </Link>
            </>
          }
        />
      </section>
    </Layout>
  );
}
