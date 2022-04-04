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
    <>
      <Suspense fallback="initial loading...">
        <p>ComponentID: {id}</p>
      </Suspense>
      <Suspense fallback="initial loading...">
        <Delay />
      </Suspense>
      <Suspense fallback="initial loading...">
        <DeferredValue />
      </Suspense>
      <Suspense fallback="initial loading...">
        <Timestamp />
      </Suspense>
      <Suspense fallback="apollonuus">
        <Apollonius />
      </Suspense>
      <Redux />
    </>
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
    <div
      style={{
        border: "solid 1px #020202",
        boxSizing: "border-box",
        padding: "1em",
      }}
    >
      <div style={{ paddingBottom: "1em", boxSizing: "border-box" }}>
        <p>loading: {loading ? "now" : "finished"}</p>
      </div>
      <div style={{ paddingBottom: "1em", boxSizing: "border-box" }}>
        <p>redux</p>
        <p>count: {value}</p>
        <div style={{ display: "flex", gap: 12 }}>
          <button onClick={add}>+</button>
          <button onClick={sub}>-</button>
        </div>
      </div>
      <div style={{ paddingBottom: "1em", boxSizing: "border-box" }}>
        <p>suspend: {Math.round(delayTime * 100) / 100}</p>
        <button onClick={fire}>startTransition</button>
      </div>
    </div>
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



type SearchQuery = TypedDocumentNode<{
  search: { issueCount: number; nodes: { number: string; title: string }[] };
}>;

const USER_FIELDS = gql`
  fragment CoreUserFields on User {
    login
    name
    websiteUrl
    avatarUrl
  }
`

const searchQuery: SearchQuery = gql`
  ${USER_FIELDS}
  query searchRepositoryIssue {
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
const Apollonius = () => {
  const searchQueryResult = useQuery(
    searchQuery,
    // useMemo(() => ({ pollInterval: 10000, variables: {} }), [])
  );

  return (
    <p style={{ whiteSpace: "pre-wrap" }}>
      {JSON.stringify(searchQueryResult, null, 2)}
    </p>
  );
};
