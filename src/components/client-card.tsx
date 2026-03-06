"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRightIcon } from "lucide-react";
import type { Client } from "@/types";

interface ClientCardProps {
  client: Client;
}

export function ClientCard({ client }: ClientCardProps) {
  const projects = client.projects ?? [];

  return (
    <Card>
      <CardHeader className="pb-2">
        <h2 className="text-lg font-semibold">{client.name}</h2>
      </CardHeader>
      <CardContent className="space-y-2">
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun projet</p>
        ) : (
          <ul className="space-y-1">
            {projects.map((project) => (
              <li key={project.id}>
                <Link
                  href={`/project/${project.id}`}
                  className="flex items-center justify-between rounded-md p-2 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{project.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {project.type}
                    </Badge>
                  </div>
                  <ChevronRightIcon className="size-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
