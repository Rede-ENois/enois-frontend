export type MentionTextareaProps = {
  value: string;
  onChange: (value: string, mentionedUserIds: string[]) => void;
  placeholder?: string;
  className?: string;
  maxLength?: number;
  rows?: number;
};
