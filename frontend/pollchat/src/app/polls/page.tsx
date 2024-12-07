"use client";

import React, { useState, useEffect } from "react";
import { createPoll, getPolls, votePoll } from "../../../services/api";
import Navbar from "../../components/Navbar";
import "./PollsPage.css"; // Import file CSS

export default function PollsPage() {
  const [polls, setPolls] = useState([]);
  const [title, setTitle] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [expiryDate, setExpiryDate] = useState(""); // New state for expiry date
  const [error, setError] = useState("");

  // Fetch polls on load
  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const data = await getPolls();
        const now = new Date();

        // Filter active polls based on expiry date
        const activePolls = data.filter((poll) => {
          if (poll.expiryDate) {
            return new Date(poll.expiryDate) > now;
          }
          return true; // Show polls without expiry
        });

        setPolls(activePolls);
      } catch (err) {
        setError("Failed to load polls");
      }
    };
    fetchPolls();
  }, []);

  // Create a new poll
  const handleCreatePoll = async () => {
    try {
      if (!title || options.some((option) => !option.trim())) {
        alert("Title and all options are required.");
        return;
      }

      await createPoll({ title, options, expiryDate });
      setTitle("");
      setOptions(["", ""]);
      setExpiryDate("");
      const data = await getPolls();
      setPolls(data);
    } catch (err) {
      setError("Failed to create poll");
    }
  };

  // Vote on a poll
  const handleVote = async (pollId, optionIndex) => {
    try {
      await votePoll(pollId, optionIndex);
      const data = await getPolls();
      setPolls(data);
    } catch (err) {
      setError("You have already voted on this poll or an error occurred.");
    }
  };

  return (
    <>
      <Navbar currentPath="/polls" />
      <div className="polls-container">
        <h1 className="title">Polls</h1>

        <div className="create-poll">
          <h2>Create Poll</h2>
          <input
            type="text"
            placeholder="Poll title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input"
          />
          {options.map((option, index) => (
            <div key={index} className="option">
              <input
                type="text"
                placeholder={`Option ${index + 1}`}
                value={option}
                onChange={(e) =>
                  setOptions(
                    options.map((opt, i) => (i === index ? e.target.value : opt))
                  )
                }
                className="input"
              />
              {options.length > 2 && (
                <button
                  onClick={() =>
                    setOptions(options.filter((_, i) => i !== index))
                  }
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button onClick={() => setOptions([...options, ""])}>Add Option</button>
          <input
            type="datetime-local"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="input"
            placeholder="Expiry Date"
          />
          <button onClick={handleCreatePoll} className="button">
            Create Poll
          </button>
        </div>

        <div className="polls-list">
          <h2>Existing Polls</h2>
          {polls.length === 0 ? (
            <p>No active polls available.</p>
          ) : (
            polls.map((poll) => (
              <div key={poll._id} className="poll">
                <h3>{poll.title}</h3>
                {poll.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleVote(poll._id, index)}
                    className="button"
                  >
                    {option.text} ({option.votes})
                  </button>
                ))}
                {poll.expiryDate && (
                  <p>Expires on: {new Date(poll.expiryDate).toLocaleString()}</p>
                )}
              </div>
            ))
          )}
        </div>

        {error && <p className="error">{error}</p>}
      </div>
    </>
  );
}
