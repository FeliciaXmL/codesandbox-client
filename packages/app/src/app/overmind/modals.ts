export const forkFrozenModal = {
  result: 'fork' as 'fork' | 'cancel' | 'unfreeze',
};

export const newSandboxModal: {
  state: { collectionId?: null | string; initialTab?: 'Import' | null };
  result: undefined;
} = {
  state: { collectionId: null, initialTab: null },
  result: undefined,
};

export const moveSandboxModal: {
  state: {
    sandboxIds: string[];
    collectionIds?: string[];
    defaultOpenedPath?: string | null;
    preventSandboxLeaving?: boolean;
  };
  result: undefined;
} = {
  state: {
    sandboxIds: [],
    collectionIds: [],
    defaultOpenedPath: null,
    preventSandboxLeaving: false,
  },
  result: undefined,
};

export const alertModal: {
  state: {
    title: string;
    message?: string;
  };
  result: boolean;
} = {
  state: { title: 'Are you sure?' },
  result: false,
};
