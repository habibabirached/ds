import logo from "./logo.svg";
import "./App.css";
import { useEffect } from "react";

function App() {
  // // called after the component is created
  // useEffect(() => {
  //   async function fetchData() {
  //     try {
  //       let res = await fetch('/api/ping');
  //       const data = await res.json()
  //       console.log(data);

  //     } catch (error) {
  //       console.log(error);
  //     }
  //   }

  //   fetchData();
  //   // no return function.
  //   // we could return a cleanup function here.
  // }, []);

  // useEffect(() => {
  //   document.title = 'My Page Title';
  // },[]);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
