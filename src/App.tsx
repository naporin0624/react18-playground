import {
  useState,
  useId,
  useTransition,
  useSyncExternalStore,
  useCallback,
  useDeferredValue,
  Suspense,
  VFC,
  memo,
  ChangeEventHandler,
  useMemo,
} from "react";
import { datasource, useReadData } from "@naporin0624/react-flowder";
import { from, interval } from "rxjs";
import {
  decrement,
  increment,
  incrementByAmount,
  selectCount,
} from "./ducks/counter";
import { useDispatch, useSelector } from "react-redux";
import { gql, TypedDocumentNode } from "@apollo/client";
import { useQuery } from "./useQuery";
import { useEffect } from "react";

const delay = (ms = 1000) => {
  return new Promise<number>((resolve) => setTimeout(() => resolve(ms), ms));
};
const datasources = {
  timeout: datasource((ms: number = 1000) => from(delay(ms))),
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
        <DeferredValue />
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
        <Redux />
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

const Redux: VFC = memo(() => {
  const value = useSelector(selectCount);
  const dispatch = useDispatch();
  const add = () => {
    dispatch(increment());
  };
  const sub = () => {
    dispatch(decrement());
  };

  const [timeout, setTime] = useState(100);
  const [loading, startTransition] = useTransition();
  const fire = useCallback(() => {
    startTransition(() => {
      const next = Math.round(Math.random() * 10);
      setTime(next);
      dispatch(incrementByAmount(next));
    });
  }, [timeout]);

  const delayTime = useReadData(datasources.timeout(timeout));

  return (
    <>
      <div>
        <p>loading: {loading ? "now" : "finished"}</p>
      </div>
      <div>
        <p>redux</p>
        <div className="flex items-center gap-6">
          <p>count: {value}</p>
          <div className="flex gap-2">
            <button
              onClick={add}
              className={[
                "bg-slate-900",
                "hover:bg-slate-700",
                "focus:outline-none",
                "focus:ring-2",
                "focus:ring-slate-400",
                "focus:ring-offset-2",
                "focus:ring-offset-slate-50",
                "text-white",
                "font-semibold",
                "w-12",
                "h-12",
                "rounded-lg",
                "w-full",
                "flex",
                "items-center",
                "justify-center",
                "box-border",
              ].join(" ")}
            >
              +
            </button>
            <button
              onClick={sub}
              className={[
                "bg-slate-900",
                "hover:bg-slate-700",
                "focus:outline-none",
                "focus:ring-2",
                "focus:ring-slate-400",
                "focus:ring-offset-2",
                "focus:ring-offset-slate-50",
                "text-white",
                "font-semibold",
                "box-border",
                "w-12",
                "h-12",
                "rounded-lg",
                "w-full",
                "flex",
                "items-center",
                "justify-center",
              ].join(" ")}
            >
              -
            </button>
          </div>
        </div>
      </div>
      <div>
        <p>suspend: {Math.round(delayTime * 100) / 100}</p>
        <button
          onClick={fire}
          className={[
            "bg-slate-900",
            "hover:bg-slate-700",
            "focus:outline-none",
            "focus:ring-2",
            "focus:ring-slate-400",
            "focus:ring-offset-2",
            "focus:ring-offset-slate-50",
            "text-white",
            "font-semibold",
            "h-12",
            "px-6",
            "rounded-lg",
            "w-full",
            "flex",
            "items-center",
            "justify-center",
          ].join(" ")}
        >
          startTransition
        </button>
      </div>
    </>
  );
});

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

const DeferredValue: VFC = memo(() => {
  const [value, setValue] = useState("");
  const handler: ChangeEventHandler<HTMLInputElement> = useCallback((event) => {
    setValue(event.target.value);
  }, []);
  const _value = useDeferredValue(value);

  return <input type="text" value={_value} onChange={handler} />;
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
          number
          title
        }
      }
    }

    user(login: "naporin0624") {
      ...CoreUserFields
    }
  }
`;
const ApolloClientSample = () => {
  const data = useQuery(
    sampleQuery,
    useMemo(() => ({ pollInterval: 10000, variables: {} }), [])
  );

  return (
    <p style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(data, null, 2)}</p>
  );
};
