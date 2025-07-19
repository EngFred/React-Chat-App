import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FiCheck, FiCheckCircle, FiPlayCircle, FiPauseCircle } from 'react-icons/fi';
import { MdSpeed } from 'react-icons/md';
import type { Message } from '../types/message';
import type { User } from '../../../shared/types/user';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import { motion, AnimatePresence } from 'framer-motion';
import ProfilePicture from '../../../shared/components/ProfilePicture';
import { capitalizeFirstLetter } from '../utils/chatHelpers';

dayjs.extend(localizedFormat);

/**
 * Defines the properties for the MessageBubble component.
 */
interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  sender: User;
  showOwnProfilePicture?: boolean; // Controls visibility of sender's profile picture for own messages
}

/**
 * MessageBubble component displays a single chat message, handling different message types
 * (text, image, video, audio) with appropriate rendering and controls.
 * It also shows sender's profile picture, message status (sent/read), and timestamp.
 */
const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwnMessage, sender, showOwnProfilePicture = true }) => {
  // State for video controls
  const [showVideoControls, setShowVideoControls] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoDuration, setVideoDuration] = useState<string | null>(null);
  const [videoPlaybackSpeed, setVideoPlaybackSpeed] = useState<number>(1);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState<string>('0:00');

  // State for audio controls
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState<string>('0:00');
  const [audioTotalDuration, setAudioTotalDuration] = useState<string | null>(null);
  const [audioPlaybackSpeed, setAudioPlaybackSpeed] = useState<number>(1);
  const [waveformData, setWaveformData] = useState<number[]>([]); // Mock waveform data

  /**
   * Effect hook to reset media player states when the message changes.
   * This ensures that controls and playback reset when a new message is rendered.
   */
  useEffect(() => {
    // Reset video states
    setShowVideoControls(false);
    setVideoDuration(null);
    setVideoPlaybackSpeed(1);
    setVideoProgress(0);
    setVideoCurrentTime('0:00');

    // Reset audio states
    setIsPlayingAudio(false);
    setAudioProgress(0);
    setAudioCurrentTime('0:00');
    setAudioTotalDuration(null);
    setAudioPlaybackSpeed(1);
    setWaveformData([]); // Clear waveform data

    // Pause and reset actual media elements
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      videoRef.current.playbackRate = 1;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.playbackRate = 1;
    }
  }, [message]); // Dependency on message ensures reset for new messages

  /**
   * Formats a given number of seconds into a human-readable time string (MM:SS).
   * @param seconds The total number of seconds.
   * @returns Formatted time string.
   */
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  /**
   * Parses the text content of a message to apply basic markdown-like formatting
   * (bold, italic, strikethrough) using HTML tags.
   * @param content The raw string content of the message.
   * @returns A React span element with dangerouslySetInnerHTML, containing formatted HTML.
   */
  const parseTextContent = (content: string) => {
    let formatted = content
      .replace(/\*(.*?)\*/g, '<strong>$1</strong>') // Bold
      .replace(/_(.*?)_/g, '<em>$1</em>')          // Italic
      .replace(/~(.*?)~/g, '<s>$1</s>');         // Strikethrough
    return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  /**
   * Effect hook to generate mock waveform data for audio messages.
   * This runs once when the message type is 'audio'.
   */
  useEffect(() => {
    if (message.type === 'audio') {
      const mockWaveform = Array.from({ length: 50 }, () => Math.random() * 10 + 5);
      setWaveformData(mockWaveform);
    }
  }, [message.type]); // Only re-run if message type changes

  /**
   * Effect hook to attach event listeners for video and audio playback
   * (loadedmetadata, timeupdate, ended) to update progress, duration, and controls.
   * It also handles cleanup of these listeners.
   */
  useEffect(() => {
    if (message.type === 'video' && videoRef.current) {
      const handleLoadedMetadata = () => {
        if (videoRef.current && !isNaN(videoRef.current.duration)) {
          setVideoDuration(formatTime(videoRef.current.duration));
        }
      };
      const handleTimeUpdate = () => {
        if (videoRef.current && !isNaN(videoRef.current.duration)) {
          const currentTime = videoRef.current.currentTime;
          const duration = videoRef.current.duration;
          setVideoProgress((currentTime / duration) * 100);
          setVideoCurrentTime(formatTime(currentTime));
        }
      };
      const handleEnded = () => {
        setShowVideoControls(false); // Hide controls after video ends
        setVideoProgress(0);
        setVideoCurrentTime('0:00');
      };
      videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      videoRef.current.addEventListener('timeupdate', handleTimeUpdate);
      videoRef.current.addEventListener('ended', handleEnded);
      return () => {
        // Clean up listeners when component unmounts or dependencies change
        if (videoRef.current) {
          videoRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
          videoRef.current.removeEventListener('timeupdate', handleTimeUpdate);
          videoRef.current.removeEventListener('ended', handleEnded);
        }
      };
    } else if (message.type === 'audio' && audioRef.current) {
      const handleLoadedMetadata = () => {
        if (audioRef.current && !isNaN(audioRef.current.duration)) {
          setAudioTotalDuration(formatTime(audioRef.current.duration));
        }
      };
      const handleTimeUpdate = () => {
        if (audioRef.current && !isNaN(audioRef.current.duration)) {
          const currentTime = audioRef.current.currentTime;
          const duration = audioRef.current.duration;
          setAudioProgress((currentTime / duration) * 100);
          setAudioCurrentTime(formatTime(currentTime));
        }
      };
      const handleEnded = () => {
        setIsPlayingAudio(false); // Stop playing state
        setAudioProgress(0);
        setAudioCurrentTime('0:00');
      };
      audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.addEventListener('ended', handleEnded);
      return () => {
        // Clean up listeners
        if (audioRef.current) {
          audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
          audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
          audioRef.current.removeEventListener('ended', handleEnded);
        }
      };
    }
  }, [message.type, message.media_url]); // Re-run if message type or media URL changes

  /**
   * Callback to toggle video playback (play/pause) and show/hide video controls.
   */
  const handleVideoPlay = useCallback(() => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().catch(error => console.error("Error playing video:", error));
        setShowVideoControls(true); // Show controls when playing
      } else {
        videoRef.current.pause();
        setShowVideoControls(false); // Hide controls when paused
      }
    }
  }, []);

  /**
   * Callback to handle seeking in the video by clicking on the progress bar.
   * @param e The mouse event from the progress bar click.
   */
  const handleVideoSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && videoRef.current.duration) {
      const progressBar = e.currentTarget;
      const clickX = e.clientX - progressBar.getBoundingClientRect().left;
      const width = progressBar.offsetWidth;
      const percent = clickX / width;
      videoRef.current.currentTime = videoRef.current.duration * percent;
    }
  }, []);

  /**
   * Callback to toggle audio playback (play/pause).
   */
  const handleAudioTogglePlay = useCallback(() => {
    if (audioRef.current) {
      if (isPlayingAudio) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(error => console.error("Error playing audio:", error));
      }
      setIsPlayingAudio(!isPlayingAudio);
    }
  }, [isPlayingAudio]); // Depends on current playing state

  /**
   * Callback to handle seeking in the audio by clicking on the progress bar.
   * @param e The mouse event from the progress bar click.
   */
  const handleAudioSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current && audioRef.current.duration) {
      const progressBar = e.currentTarget;
      const clickX = e.clientX - progressBar.getBoundingClientRect().left;
      const width = progressBar.offsetWidth;
      const percent = clickX / width;
      audioRef.current.currentTime = audioRef.current.duration * percent;
    }
  }, []);

  /**
   * Callback to cycle through audio playback speeds (1x, 1.5x, 2x).
   */
  const handleAudioPlaybackSpeedChange = useCallback(() => {
    if (audioRef.current) {
      const speeds = [1, 1.5, 2];
      const currentIndex = speeds.indexOf(audioPlaybackSpeed);
      const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
      audioRef.current.playbackRate = nextSpeed;
      setAudioPlaybackSpeed(nextSpeed);
    }
  }, [audioPlaybackSpeed]); // Depends on current playback speed

  /**
   * Callback to cycle through video playback speeds (1x, 1.5x, 2x).
   */
  const handleVideoPlaybackSpeedChange = useCallback(() => {
    if (videoRef.current) {
      const speeds = [1, 1.5, 2];
      const currentIndex = speeds.indexOf(videoPlaybackSpeed);
      const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
      videoRef.current.playbackRate = nextSpeed;
      setVideoPlaybackSpeed(nextSpeed);
    }
  }, [videoPlaybackSpeed]); // Depends on current playback speed

  // Determine base CSS classes for the message bubble based on sender
  const baseBubbleClasses = isOwnMessage
    ? 'bg-message-bg-self ml-auto rounded-tl-xl rounded-tr-lg rounded-bl-xl rounded-br-xl shadow-sm relative before:content-[""] before:absolute before:bottom-0 before:right-[-8px] before:w-0 before:h-0 before:border-l-[8px] before:border-l-transparent before:border-b-[8px] before:border-b-message-bg-self before:border-r-[8px] before:border-r-message-bg-self'
    : 'bg-message-bg-other mr-auto rounded-tr-xl rounded-tl-lg rounded-br-xl rounded-bl-xl shadow-sm relative before:content-[""] before:absolute before:bottom-0 before:left-[-8px] before:w-0 before:h-0 before:border-r-[8px] before:border-r-transparent before:border-b-[8px] before:border-b-message-bg-other before:border-l-[8px] before:border-l-message-bg-other';

  // Check if the message has been read by the receiver for own messages
  const isRead = isOwnMessage && message.read_by?.includes(message.receiver_id);
  // Check if media message has a custom caption
  const isMediaWithCaption = (message.type !== 'text' && message.content && message.content !== `[${capitalizeFirstLetter(message.type)}]`);

  /**
   * Renders the timestamp and message status overlay, typically for media messages.
   */
  const renderTimestampAndStatusOverlay = () => (
    <div className="absolute bottom-1 right-1 flex items-center text-[10px] gap-1 px-1.5 py-0.5 rounded-md bg-black bg-opacity-50 text-white">
      <span>{dayjs(message.timestamp).format('LT')}</span>
      {isOwnMessage && (
        <span className="ml-0.5">
          {isRead ? (
            <FiCheckCircle size={14} className="text-primary" title="Read" />
          ) : (
            <FiCheck size={14} className="text-white" title="Sent" />
          )}
        </span>
      )}
    </div>
  );

  /**
   * Renders the timestamp and message status as a footer, typically for text messages.
   */
  const renderTimestampAndStatusFooter = () => (
    <div className={`flex items-center justify-end text-[10px] mt-1.5 gap-1 px-4 pb-2 ${isOwnMessage ? 'text-text-secondary' : 'text-text-secondary'}`}>
      <span>{dayjs(message.timestamp).format('LT')}</span>
      {isOwnMessage && (
        <span className="ml-0.5">
          {isRead ? (
            <FiCheckCircle size={14} className="text-primary" title="Read" />
          ) : (
            <FiCheck size={14} className="text-text-secondary" title="Sent" />
          )}
        </span>
      )}
    </div>
  );

  /**
   * Renders the content based on the message type (image, video, audio, text).
   * Includes specific controls and UI for each media type.
   */
  const renderMediaContent = () => {
    switch (message.type) {
      case 'image':
        return message.media_url ? (
          <div className="relative w-full h-auto max-w-full rounded-lg overflow-hidden border border-gray-200 shadow-sm">
            <img
              src={message.media_url}
              alt={message.content || 'Image message'}
              className="w-full h-auto object-contain cursor-pointer max-h-96"
              onClick={() => window.open(message.media_url!, '_blank')} // Open image in new tab
            />
            {renderTimestampAndStatusOverlay()}
          </div>
        ) : (
          <div className="flex items-center justify-center bg-gray-700 text-text-secondary rounded-lg p-4 min-h-[100px] w-full">
            <span className="text-sm italic">Image failed to load.</span>
          </div>
        );

      case 'video':
        return message.media_url ? (
          <div className="relative rounded-lg overflow-hidden w-full border border-gray-200 shadow-sm" style={{ maxHeight: '300px' }}>
            <video
              ref={videoRef}
              src={message.media_url}
              className="w-full h-full object-contain"
              preload="metadata" // Load metadata to get duration
              onEnded={() => setShowVideoControls(false)}
            />
            <AnimatePresence>
              {!showVideoControls && (
                <motion.div
                  key="video-overlay"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 cursor-pointer"
                  onClick={handleVideoPlay}
                >
                  <FiPlayCircle size={60} className="text-white opacity-80 hover:opacity-100 transition-opacity" />
                </motion.div>
              )}
            </AnimatePresence>
            {showVideoControls && (
              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-sm p-2 flex items-center justify-between">
                <button onClick={handleVideoPlay} className="p-1">
                  {videoRef.current?.paused ? <FiPlayCircle size={20} /> : <FiPauseCircle size={20} />}
                </button>
                <div className="flex-1 mx-2 h-1 bg-gray-400 rounded-full relative cursor-pointer" onClick={handleVideoSeek}>
                  <div className="absolute h-full bg-primary rounded-full" style={{ width: `${videoProgress}%` }} />
                  <div className="absolute top-[-4px] w-3 h-3 rounded-full bg-white border border-primary" style={{ left: `${videoProgress}%` }} />
                </div>
                <span>{videoCurrentTime} / {videoDuration}</span>
                <button onClick={handleVideoPlaybackSpeedChange} className="p-1">
                  <MdSpeed size={16} /> {videoPlaybackSpeed}x
                </button>
              </div>
            )}
            {videoDuration && !showVideoControls && ( // Show duration only if controls are hidden
              <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-[10px] px-1.5 py-0.5 rounded-md">
                {videoDuration}
              </div>
            )}
            {renderTimestampAndStatusOverlay()}
          </div>
        ) : (
          <div className="flex items-center justify-center bg-gray-700 text-text-secondary rounded-lg p-4 min-h-[100px] w-full">
            <span className="text-sm italic">Video failed to load.</span>
          </div>
        );

      case 'audio':
        return message.media_url ? (
          <div className="relative flex items-center p-2 rounded-lg shadow-md w-full bg-background">
            {/* Show sender's profile picture for incoming audio messages */}
            {!isOwnMessage && (
              <ProfilePicture
                src={sender.profile_picture}
                alt={sender.username}
                size={8}
                className="mr-3 flex-shrink-0"
              />
            )}
            <div className="flex-1 flex items-center min-w-0">
              <button
                onClick={handleAudioTogglePlay}
                className={`flex-shrink-0 rounded-full ${isOwnMessage ? 'bg-primary' : 'bg-secondary'} text-white p-2 flex items-center justify-center hover:opacity-90 transition-opacity`}
              >
                {isPlayingAudio ? <FiPauseCircle size={24} /> : <FiPlayCircle size={24} />}
              </button>
              <div className="flex-1 ml-3 flex flex-col">
                <div className="relative h-6 flex items-center">
                  {/* Waveform Visualization (mocked) */}
                  <div className="flex-1 flex items-center h-full">
                    {waveformData.map((height, index) => (
                      <div
                        key={index}
                        className={`h-[${height}px] w-[2px] rounded-full mx-[1px] ${
                          index < (audioProgress / 100) * waveformData.length
                            ? isOwnMessage
                              ? 'bg-primary'
                              : 'bg-secondary'
                            : 'bg-gray-300'
                        }`}
                        style={{ height: `${height}px` }}
                      />
                    ))}
                  </div>
                  {/* Seekable progress indicator */}
                  <div
                    className="absolute top-0 bottom-0 w-2 h-2 rounded-full bg-white border-2 border-primary shadow cursor-pointer"
                    style={{ left: `${audioProgress}%`, transform: 'translateX(-50%)' }}
                    onClick={handleAudioSeek}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-text-secondary mt-1">
                  <span>{audioCurrentTime} / {audioTotalDuration}</span>
                  <button
                    onClick={handleAudioPlaybackSpeedChange}
                    className="flex items-center text-[10px] text-text-secondary hover:text-primary transition-colors"
                  >
                    <MdSpeed size={12} className="mr-1" />
                    {audioPlaybackSpeed}x
                  </button>
                </div>
              </div>
            </div>
            <audio ref={audioRef} src={message.media_url} preload="metadata" className="hidden" />
            {renderTimestampAndStatusOverlay()}
          </div>
        ) : (
          <div className="flex items-center justify-center bg-gray-700 text-text-secondary rounded-lg p-4 min-h-[60px] w-full">
            <span className="text-sm italic">Audio failed to load.</span>
          </div>
        );

      case 'text':
      default:
        // Render text content with markdown parsing
        return <p className="text-sm break-words leading-snug">{parseTextContent(message.content)}</p>;
    }
  };

  return (
    <motion.div
      className={`flex items-end mb-3 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
      initial={{ opacity: 0, y: 15 }} // Animation for new messages
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Sender's profile picture for incoming messages */}
      {!isOwnMessage && (
        <ProfilePicture
          src={sender.profile_picture}
          alt={sender.username}
          size={8}
          className="mr-2 mb-0.5 flex-shrink-0"
        />
      )}
      {/* Message Bubble Container */}
      <div className={`flex flex-col ${baseBubbleClasses} ${message.type === 'audio' ? 'max-w-[85%] sm:max-w-[75%]' : 'max-w-[75%] sm:max-w-[65%]'}`}>
        {/* Sender's username for incoming text messages */}
        {!isOwnMessage && message.type === 'text' && (
          <span className="text-xs font-semibold mb-0.5 text-primary break-words px-4 pt-2">
            {capitalizeFirstLetter(sender.username)}
          </span>
        )}
        {/* Render media or text content */}
        {(message.type === 'image' || message.type === 'video' || message.type === 'audio') ? (
          <div className="relative w-full">
            {renderMediaContent()}
          </div>
        ) : (
          <p className="text-sm break-words leading-snug px-4 py-2 text-text-primary">{parseTextContent(message.content)}</p>
        )}
        {/* Render caption for media messages separately if it exists */}
        {isMediaWithCaption && (
          <p className="text-sm break-words leading-snug px-4 py-2 text-text-primary">{parseTextContent(message.content)}</p>
        )}
        {/* Render timestamp and status for text messages as a footer */}
        {message.type === 'text' && renderTimestampAndStatusFooter()}
      </div>
      {/* Own profile picture for outgoing messages, if enabled */}
      {isOwnMessage && showOwnProfilePicture && (
        <ProfilePicture
          src={sender.profile_picture}
          alt={sender.username}
          size={8}
          className="ml-2 mb-0.5 flex-shrink-0"
        />
      )}
    </motion.div>
  );
};

export default MessageBubble;