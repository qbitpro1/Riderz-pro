import { ApiError, guardMutation, ok, readJson, route } from "@/lib/server/http";
import { deleteAddress, requireCustomer, saveAddress } from "@/lib/server/customers";
import { addressSchema } from "@/lib/account/schemas";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

const addressId = async (params: Ctx["params"]) => {
  const { id } = await params;
  if (!/^adr_[A-Za-z0-9_-]{10,40}$/.test(id)) throw new ApiError(404, "not_found", "That address was not found.");
  return id;
};

/** PUT { address fields } → { address } */
export const PUT = route(async (req: Request, { params }: Ctx) => {
  guardMutation(req);
  const me = await requireCustomer();
  const id = await addressId(params);
  const input = await readJson(req, addressSchema);
  return ok({ address: await saveAddress(me.id, input, id) });
});

/** DELETE → { deleted: true } */
export const DELETE = route(async (req: Request, { params }: Ctx) => {
  guardMutation(req);
  const me = await requireCustomer();
  await deleteAddress(me.id, await addressId(params));
  return ok({ deleted: true });
});
