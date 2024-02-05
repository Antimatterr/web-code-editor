import { createRoot } from "react-dom/client";
import { useState, useEffect, useRef } from "react";
import * as esbuild from "esbuild-wasm";
import { unpkgPathPlugin } from "./plugins/unpkg-path-plugin";
import { fetchPlugin } from "./plugins/fetch-plugin";

const App = () => {
  const [input, setInput] = useState(""); //input code from user
  const ref = useRef<any>();
  const iframeRef = useRef<any>();

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

    iframeRef.current.srcdocc = html;

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

    // setCode(result.outputFiles[0].text);
    iframeRef.current.contentWindow.postMessage(
      result.outputFiles[0].text,
      "*"
    );
  };

  const html = `
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
  </head>
  <body>
  <div id="root"></div>
    <script>
      window.addEventListener('message', (event) => {
        try {
          eval(event.data)
        } catch (error) {
          const root = document.querySelector('#root');
          root.innerHTML = '<div style="color: red;"><h4>Runtime Error</h4>' + error + '</div>';
          console.error(error);
        }

      }, false)
    </script>
  </body>
  </html>
  `;

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
      <iframe
        title="Code Preview"
        ref={iframeRef}
        srcDoc={html}
        sandbox="allow-scripts"
      ></iframe>
    </div>
  );
};

// we can use non-null assertion operator in typescript to tell typescript that the root element will always exist
const domnode = document.querySelector("#root")!;
const root = createRoot(domnode);
root.render(<App />);
