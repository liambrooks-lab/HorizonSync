import { notFound, redirect } from "next/navigation";

import { BlockEditor } from "@/modules/myspace/components/BlockEditor";
import { getWorkspaceDocument } from "@/modules/myspace/lib/documents";
import { getCurrentUser } from "@/shared/lib/auth";

type MySpaceDocumentPageProps = {
  params: {
    documentId: string;
  };
};

export default async function MySpaceDocumentPage({
  params,
}: MySpaceDocumentPageProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const document = await getWorkspaceDocument(params.documentId, currentUser.id);

  if (!document) {
    notFound();
  }

  return (
    <BlockEditor document={document} />
  );
}
