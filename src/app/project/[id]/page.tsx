import { ProjectPage } from "@/components/project-page";

export default async function ProjectRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProjectPage projectId={id} />;
}
