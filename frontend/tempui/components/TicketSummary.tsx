/* eslint-disable react/no-unescaped-entities */
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Typewriter from "typewriter-effect";

const TicketSummary = ({ props }: { props: any }) => {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
      className="bg-gray-800 text-white p-4 rounded-lg max-w-md mx-auto"
    >
      <div className="mb-4">
        <h2 className="text-xl font-bold">Information</h2>
        <div className="flex items-center mt-2">
          <img
            className="w-10 h-10 bg-gray-600 rounded-full mr-3"
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTjOq83w7kS5Jw6K3_CsCE3crc_zcXvVVU_mw&s"
            alt="User"
          />
          <div>
            {props?.name != "" ? (
              <Typewriter
                options={{
                  strings: props?.name,
                  autoStart: true,
                  loop: false,
                }}
              />
            ) : (
              <p className="font-semibold">{props?.name}</p>
            )}
            {/* <p className="text-sm text-white">abc@gmail.com</p> */}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold text-gray-200">Event:</h3>
        <Card className="mt-2 border-gray-600">
          <CardContent className="flex items-center p-2 bg-gray-600 border-gray-200">
            <img
              src="https://static.vecteezy.com/system/resources/thumbnails/016/314/814/small_2x/transparent-event-schedule-icon-free-png.png"
              alt="Event"
              className="w-10 h-10 rounded mr-3"
            />
            <div style={{ color: "white" }}>
              {props?.show != "" ? (
                <Typewriter
                  options={{
                    strings: props?.show,
                    autoStart: true,
                    loop: false,
                  }}
                />
              ) : (
                <p className="font-semibold text-gray-200">{props?.show}</p>
              )}

              {/* <p className="text-sm text-gray-200">small description</p> */}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-4">
        <p className="font-semibold">Have a promo code?</p>
        <div className="flex mt-2">
          <Input
            placeholder="Promo code"
            className="flex-grow mr-2 bg-gray-600 border-gray-500 text-gray-200"
          />
          <Button variant="ghost">Apply</Button>
        </div>
      </div>

      <Card className="bg-gray-600 text-gray-200 border-gray-600">
        <CardHeader>
          <h3 className="font-semibold">Summary</h3>
        </CardHeader>
        <CardContent>
          <div style={{ color: "white" }} className="space-y-2">
            <div className="flex justify-between">
              <p>General ticket</p>
              {props?.total_amount != "" ? (
                <Typewriter
                  options={{
                    strings: `₹ ${
                      parseInt(props?.total_amount) / props?.number_of_tickets
                    }`,
                    autoStart: true,
                    loop: false,
                  }}
                />
              ) : (
                <p>₹ 0</p>
              )}
            </div>
            <p className="text-sm text-white"></p>
            <Typewriter
              options={{
                strings: `Qty: ${props?.number_of_tickets}`,
                autoStart: true,
                loop: false,
              }}
            />
            {/* <div className="flex justify-between">
              <p>Student ticket</p>
              <p>₹ 0</p>
            </div>
            <p className="text-sm text-white">Qty: 0</p> */}
            <div className="flex justify-between">
              <p>Discount</p>
              <p>₹ 0</p>
            </div>
            <div className="flex justify-between font-semibold pt-2 border-t">
              <p>Total Amount</p>
              <Typewriter
                options={{
                  strings: `₹ ${props?.total_amount}`,
                  autoStart: true,
                  loop: false,
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button className="w-full mt-4 bg-blue-500 text-white">
        Proceed to Payment
      </Button>
    </div>
  );
};

export default TicketSummary;
