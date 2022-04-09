import {
  useState,
  useId,
  useTransition,
  useSyncExternalStore,
  useCallback,
  Suspense,
  VFC,
  memo,
  useMemo,
} from "react";
import { datasource, useReadData } from "@naporin0624/react-flowder";
import { useImage } from "@naporin0624/react-flowder/utils";
import {
  useSyncQuery,
  useApolloReset,
} from "@naporin0624/react-flowder/apollo";
import { interval } from "rxjs";
import { gql, TypedDocumentNode } from "@apollo/client";
import { useEffect } from "react";

const delay = (ms = 1000) => {
  return new Promise<number>((resolve) => setTimeout(() => resolve(ms), ms));
};
const datasources = {
  timeout: datasource(delay),
  interval: datasource(() => interval(2000)),
};

const useHook = () => {
  const id = useId();
  return id;
};

function App() {
  const id = useId();

  // rerender check
  const [, setState] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setState((c) => c + 1);
    }, 1000);

    return () => {
      clearInterval(id);
    };
  }, []);

  return (
    <div className="container mx-auto px-2">
      <header className="mt-2 mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          React18 playground
        </h1>
      </header>
      <div className="bg-slate-100 rounded-xl p-8 dark:bg-stale-800 mb-4">
        <p>ComponentID: {id}</p>
      </div>
      <div className="bg-slate-100 rounded-xl p-8 dark:bg-stale-800 mb-4">
        <Suspense fallback="image-loading....">
          <Images />
        </Suspense>
      </div>
      <div className="bg-slate-100 rounded-xl p-8 dark:bg-stale-800 mb-4">
        <Suspense fallback="initial loading...">
          <Delay />
        </Suspense>
      </div>
      <div className="bg-slate-100 rounded-xl p-8 dark:bg-stale-800 mb-4">
        <Suspense fallback="initial loading...">
          <Timestamp />
        </Suspense>
      </div>
      <div className="bg-slate-100 rounded-xl p-8 dark:bg-stale-800 mb-4">
        <Suspense fallback="apollo-client-loading...">
          <ApolloClientSample />
        </Suspense>
      </div>
    </div>
  );
}

export default memo(App);

const Delay: VFC = memo(() => {
  const id = useHook();
  const [timeout, setTimeout] = useState(1000);
  const [loading, startTransition] = useTransition();
  const fire = useCallback(() => {
    startTransition(() => {
      setTimeout((t) => t * 1.1);
    });
  }, []);

  const delayTime = useReadData(datasources.timeout(timeout));

  return (
    <div>
      <p>id: {id}</p>
      {loading ? <p>loading...</p> : <p>delay: {delayTime}</p>}
      <button onClick={fire}>fire</button>
    </div>
  );
});

const createStore = () => {
  const timestamp = interval(10000);
  let value: null | number = null;

  return {
    subscribe(onChangeSnapshot: () => void) {
      const dispose = timestamp.subscribe((v) => {
        value = v;
        onChangeSnapshot();
      });

      return () => {
        dispose.unsubscribe();
      };
    },
    getSnapshot() {
      if (!value) return 0;

      return value;
    },
  };
};
const store = createStore();
const Timestamp: VFC = memo(() => {
  const value = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    () => 1
  );
  const timer = useReadData(datasources.interval());

  return (
    <div>
      <p>value: {value}</p>
      <p>timer: {timer}</p>
    </div>
  );
});

type SampleQuery = TypedDocumentNode<{
  search: { issueCount: number; nodes: { number: string; title: string }[] };
  user: { login: string; name: string; websiteUrl: string; avatarUrl: string };
}>;

const USER_FIELDS = gql`
  fragment CoreUserFields on User {
    login
    name
    websiteUrl
    avatarUrl
  }
`;

const sampleQuery: SampleQuery = gql`
  ${USER_FIELDS}
  query SampleQuery {
    search(query: "repo:apollographql/apollo is:issue", type: ISSUE, first: 5) {
      issueCount
      nodes {
        ... on Issue {
          id
          number
          title
          createdAt
        }
      }
    }

    user(login: "naporin0624") {
      ...CoreUserFields
    }
  }
`;
const ApolloClientSample = memo(() => {
  const data = useSyncQuery(
    sampleQuery,
    useMemo(() => ({ pollInterval: 10000, variables: {} }), [])
  );
  const reset = useApolloReset();

  return (
    <div>
      <button onClick={reset}>reset</button>
      <p style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(data, null, 2)}</p>
    </div>
  );
});

const Images = memo(() => {
  const [img] = useImage(
    "http://placekitten.com/g/500/500",
    "http://placekitten.com/g/2000/2000",
    "http://placekitten.com/g/4000/4000"
  );

  return (
    <img
      src={img.src}
      width={img.width}
      height={img.height}
      style={{ width: 200, height: 200, objectFit: "contain" }}
    />
  );
});
