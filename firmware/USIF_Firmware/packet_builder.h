#ifndef PACKET_BUILDER_H
#define PACKET_BUILDER_H

#include <Arduino.h>

String buildJsonPayload(const String& id, float value);

#endif
