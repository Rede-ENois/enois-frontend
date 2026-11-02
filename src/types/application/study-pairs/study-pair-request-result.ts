/** POST /study-pairs/requests: matched right away or waiting in the queue. */
export type StudyPairRequestResult = {
  requestId: string;
  status: "OPEN" | "MATCHED";
  pairId: string | null;
};
