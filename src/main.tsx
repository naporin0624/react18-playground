import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { Provider as DatasourceProvider } from "@naporin0624/react-flowder";
import { ApolloClient, InMemoryCache, ApolloProvider } from "@apollo/client";

import "./index.css";

const token = import.meta.env.VITE_GITHUB_TOKEN;
const client = new ApolloClient({
  uri: "https://api.github.com/graphql",
  headers: { authorization: `Bearer ${token}` },
  cache: new InMemoryCache(),
});

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <DatasourceProvider>
        <Suspense fallback={null}>
          <App />
        </Suspense>
      </DatasourceProvider>
    </ApolloProvider>
  </React.StrictMode>
);
