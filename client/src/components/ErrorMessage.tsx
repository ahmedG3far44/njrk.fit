interface ErrorMessageProps {
  message?: string
  className?: string
}

const ErrorMessage = ({ message, className }: ErrorMessageProps) => {
  if (!message) return null
  return (
    <p className={`text-red-500 text-[10px] font-semibold mt-1 p-2 ${className}`}>
      {message}
    </p>
  )
}

export default ErrorMessage