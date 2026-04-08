import { PlaceholderPanel } from "@/shared/components/PlaceholderPanel";

type GlobalPostPageProps = {
  params: {
    postId: string;
  };
};

export default function GlobalPostPage({ params }: GlobalPostPageProps) {
  return (
    <PlaceholderPanel
      description={`Post detail route is wired and ready. Dynamic post rendering for "${params.postId}" will be expanded in a later phase.`}
      title="Global post detail"
    />
  );
}
