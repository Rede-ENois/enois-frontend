import { Link } from "@tanstack/react-router";

import type { AuthorInfoProps } from "@/types/components/post/author-info-props";

import { createAuthorInfoViewModel } from "@/utils/components/post/create-author-info-view-model";

import { UserAvatar } from "@/components/user-avatar";

export function AuthorInfo(props: AuthorInfoProps) {
  const { authorUsername, authorName, authorAvatar, fallbackClassName } = props;
  const { timeLabel } = createAuthorInfoViewModel(props);

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
            className="font-bold hover:underline text-[14px]"
          >
            {authorName}
          </Link>

          <span className="text-[12px] font-light text-text-date">{timeLabel}</span>
        </div>
      </div>
    </div>
  );
}
