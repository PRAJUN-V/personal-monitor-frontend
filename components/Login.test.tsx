import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import Login from "@/components/Login";

describe("<Login />", () => {
  it("submits the entered username and password", () => {
    const onLogin = vi.fn();
    render(<Login onLogin={onLogin} isLoading={false} error="" />);

    fireEvent.change(screen.getByPlaceholderText("Enter username"), {
      target: { value: "prajun" },
    });
    fireEvent.change(screen.getByPlaceholderText("••••••••"), {
      target: { value: "1234" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    expect(onLogin).toHaveBeenCalledWith("prajun", "1234");
  });

  it("renders an error message when provided", () => {
    render(<Login onLogin={() => {}} isLoading={false} error="Invalid username or password" />);
    expect(screen.getByText("Invalid username or password")).toBeInTheDocument();
  });

  it("shows a loading state and disables the button", () => {
    render(<Login onLogin={() => {}} isLoading error="" />);
    const button = screen.getByRole("button", { name: /signing in/i });
    expect(button).toBeDisabled();
  });

  it("toggles password visibility", () => {
    render(<Login onLogin={() => {}} isLoading={false} error="" />);
    const password = screen.getByPlaceholderText("••••••••") as HTMLInputElement;
    expect(password.type).toBe("password");
    fireEvent.click(screen.getByRole("button", { name: /show password/i }));
    expect(password.type).toBe("text");
  });
});
