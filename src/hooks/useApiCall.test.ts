import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useApiCall } from "./useApiCall";

describe("useApiCall", () => {
  it("success lifecycle: sets loading, stores data, and runs onSuccess", async () => {
    const onSuccess = vi.fn();
    const payload = { id: 42, name: "Member record" };

    const { result } = renderHook(() =>
      useApiCall(async () => payload, onSuccess)
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();

    await act(async () => {
      await result.current.execute();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(payload);
    expect(result.current.error).toBeNull();
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onSuccess).toHaveBeenCalledWith(payload);
  });

  it("failure lifecycle: registers error, stops loading, and runs onError", async () => {
    const apiError = new Error("Request failed");
    const onError = vi.fn();

    const { result } = renderHook(() =>
      useApiCall(async () => {
        throw apiError;
      }, undefined, onError)
    );

    await act(async () => {
      await result.current.execute();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe("Request failed");
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(apiError);
  });

  it("reset clears data, error, and loading state", async () => {
    const { result } = renderHook(() =>
      useApiCall(async () => ({ ok: true }))
    );

    await act(async () => {
      await result.current.execute();
    });

    await waitFor(() => {
      expect(result.current.data).toEqual({ ok: true });
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});
