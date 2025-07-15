"use client";

import { useParams, usePathname } from 'next/navigation';
import { useDriveStore } from "@/hooks/useDrive";
import { useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Editor from '@/components/layout/middle-content/page-views/document/Editor';
import { ViewHeader } from './content-header';
import { usePageTree } from '@/hooks/usePageTree';
import { findNodeAndParent } from '@/lib/tree-utils';
import FolderView from './page-views/folder/FolderView';
import AiChatView from './page-views/ai-page/AiChatView';
import ChannelView from './page-views/ai-page/ChannelView';
import { CustomScrollArea } from '@/components/ui/custom-scroll-area';
import { PageType } from '@pagespace/lib';
import AiSettingsView from './page-views/settings/AiSettingsView';

function DriveGrid() {
  const { drives, fetchDrives, isLoading } = useDriveStore();

  useEffect(() => {
    fetchDrives();
  }, [fetchDrives]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {drives.map((drive) => (
        <Link key={drive.id} href={`/dashboard/${drive.slug}`}>
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>{drive.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Drive</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}

const PageContent = ({ pageId }: { pageId: string | null }) => {
  const params = useParams();
  const pathname = usePathname();
  const driveSlug = params.driveSlug as string;
  const { tree, isLoading } = usePageTree(driveSlug);

  if (pathname.endsWith('/settings')) {
    return <AiSettingsView />;
  }

  if (isLoading) {
    return <Skeleton className="h-full w-full" />;
  }

  if (!pageId) {
    return <div className="p-4">Select a page to view its content.</div>;
  }

  const pageResult = findNodeAndParent(tree, pageId);

  if (!pageResult) {
    return <div className="p-4">Page not found in the current tree.</div>;
  }
  const { node: page } = pageResult;

  switch (page.type) {
    case PageType.DOCUMENT:
      return <Editor key={page.id} page={page} />;
    case PageType.FOLDER:
      return <FolderView key={page.id} page={page} />;
    case PageType.AI_CHAT:
      return <AiChatView key={page.id} page={page} />;
    case PageType.CHANNEL:
      return <ChannelView key={page.id} page={page} />;
    case PageType.DATABASE:
        return <div className="p-4">This page type is deprecated.</div>;
    default:
      return <div className="p-4">This page type is not supported.</div>;
  }
};

export default function CenterPanel() {
    const params = useParams();
    const pathname = usePathname();
    const { driveSlug, pageId } = params;

  return (
    <div className="h-full flex flex-col">
        {pageId || pathname.endsWith('/settings') ? (
            <>
              <ViewHeader />
              <CustomScrollArea className="flex-1">
                <PageContent pageId={pageId as string} />
              </CustomScrollArea>
            </>
        ) : (
          <CustomScrollArea className="h-full p-4">
            {!driveSlug && (
              <>
                <h1 className="text-2xl font-bold mb-6">My Drives</h1>
                <DriveGrid />
              </>
            )}
          </CustomScrollArea>
        )}
    </div>
  );
}