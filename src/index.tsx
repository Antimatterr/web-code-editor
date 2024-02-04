import { createRoot } from "react-dom/client";
import { useState, useEffect, useRef } from "react";
import * as esbuild from "esbuild-wasm";
import { unpkgPathPlugin } from "./plugins/unpkg-path-plugin";
import { fetchPlugin } from "./plugins/fetch-plugin";

const App = () => {
  const [input, setInput] = useState(""); //input code from user
  const [code, setCode] = useState(""); //transpilled and bundled code
  const ref = useRef<any>();

  //start service promise which will be available in later time in the future
  const startService = async () => {
    ref.current = await esbuild.startService({
      worker: true,
      // wasmURL: "/esbuild.wasm",
      wasmURL: "https://unpkg.com/esbuild-wasm@0.8.27/esbuild.wasm",
    });
  };

  //initialize the service everytime the page reloads
  useEffect(() => {
    startService();
  }, []);

  //1.now to access the services provided by the startService we need to save the services in the state and then use it in other parts of the component
  //2.

  //do transpilling and show the code in pre tag
  const onclick = async () => {
    if (!ref.current) {
      return;
    }

    const result = await ref.current.build({
      entryPoints: ["index.js"],
      bundle: true,
      write: false,
      plugins: [unpkgPathPlugin(), fetchPlugin(input)], //plugins runs from left to right
      define: {
        "process.env.NODE_ENV": '"production"',
        global: "window",
      },
    });

    console.log(result);
    // setCode(result.code);
    setCode(result.outputFiles[0].text);
  };

  return (
    <div>
      <textarea
        onChange={(e) => setInput(e.target.value)}
        value={input}
        name=""
        id=""
        cols={30}
        rows={10}
      ></textarea>
      <div>
        <button onClick={onclick}>Submit</button>
      </div>
      <pre>{code}</pre>
    </div>
  );
};

// we can use non-null assertion operator in typescript to tell typescript that the root element will always exist
const domnode = document.querySelector("#root")!;
const root = createRoot(domnode);
root.render(<App />);
