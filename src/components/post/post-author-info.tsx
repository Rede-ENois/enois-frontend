import { Link } from "@tanstack/react-router";

import { UserAvatar } from "@/components/user-avatar";
import { formatRelativeTime } from "@/utils/time";

type AuthorInfoProps = {
  authorUsername: string;
  authorName: string;
  authorAvatar: string | null;
  createdAt: string;
  fallbackClassName?: string;
};

export function AuthorInfo({
  authorUsername,
  authorName,
  authorAvatar,
  createdAt,
  fallbackClassName,
}: AuthorInfoProps) {
  return (
    <div className="flex items-start gap-3">
      <Link to="/perfil/$username" params={{ username: authorUsername }}>
        <UserAvatar
          src={authorAvatar}
          alt={authorName}
          fallbackClassName={fallbackClassName}
          className="h-11 w-11"
        />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <Link
            to="/perfil/$username"
            params={{ username: authorUsername }}
            className="text-[14px] font-bold hover:underline"
          >
            {authorName}
          </Link>
          <span className="text-[12px] font-light text-text-date">
            · {formatRelativeTime(createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
