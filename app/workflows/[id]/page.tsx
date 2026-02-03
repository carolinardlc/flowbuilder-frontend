import WorkflowCanvas from "./_components/WorkflowCanvas";

type WorkflowsDetailProps = {
  params: Promise<{ id: string }>;
};

export default async function WorkflowsDetail({
  params,
}: WorkflowsDetailProps) {
  const { id } = await params;

  // Canvas view doesn't use Layout - renders toolbar directly instead of app header
  return (
    <div className="app-shell canvas-page">
      <main className="app-main app-main--wide app-main--no-header">
        <section className="app-card app-card--wide canvas-shell">
          <WorkflowCanvas workflowId={id} />
        </section>
      </main>
    </div>
  );
}
