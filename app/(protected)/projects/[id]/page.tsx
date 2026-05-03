import { ProjectScreen } from "@/components/projects/project-screen";

export default function ProjectPage({
  params
}: {
  params: { id: string };
}) {
  return <ProjectScreen projectId={params.id} />;
}
