// import { useState } from 'react';
// import reactLogo from './assets/react.svg';
// import viteLogo from '/vite.svg';
// import './App.css';

export const Dashboard = () => {
  //   const [count, setCount] = useState(0);

  return (
    <div className="card w-96 bg-base-100 shadow-sm">
      <div className="card-body">
        <span className="badge badge-xs badge-warning">Most Popular</span>
        <div className="flex justify-between">
          <h2 className="text-3xl font-bold">Premium</h2>
          <span className="text-xl">$29/mo</span>
        </div>
        <ul className="mt-6 flex flex-col gap-2 text-xs">
          <li>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="me-2 inline-block size-4 text-success"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>High-resolution image generation</span>
          </li>
          <li>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="me-2 inline-block size-4 text-success"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>Customizable style templates</span>
          </li>
          <li>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="me-2 inline-block size-4 text-success"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>Batch processing capabilities</span>
          </li>
          <li>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="me-2 inline-block size-4 text-success"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>AI-driven image enhancements</span>
          </li>
          <li className="opacity-50">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="me-2 inline-block size-4 text-base-content/50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="line-through">Seamless cloud integration</span>
          </li>
          <li className="opacity-50">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="me-2 inline-block size-4 text-base-content/50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="line-through">Real-time collaboration tools</span>
          </li>
        </ul>
        <div className="mt-6">
          <button className="btn btn-block btn-primary">Subscribe</button>
        </div>
      </div>
    </div>
  );
};
