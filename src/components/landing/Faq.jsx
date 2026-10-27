"use client";

import { Accordion, Box, Container, Span } from "@chakra-ui/react";
import SectionHead from "@/components/common/SectionHead";
import Reveal from "@/components/common/Reveal";
import { faqs } from "@/data/content";

/** FAQ : Accordion Chakra UI v3 (Accordion.Root / Item / ItemTrigger / ItemContent). */
export default function Faq() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
  };

  return (
    <Box as="section" id="faq" pb={{ base: "20", md: "28" }} scrollMarginTop="80px">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Container maxW="3xl">
        <Reveal>
          <SectionHead pill="FAQ" title="Questions fréquentes" />
        </Reveal>
        <Accordion.Root collapsible defaultValue={["0"]} variant="plain" mt="12">
          {faqs.map((f, i) => (
            <Accordion.Item
              key={f.q}
              value={String(i)}
              mb="3"
              rounded="2xl"
              bg="paper.100"
              borderWidth="1px"
              borderColor="paper.300"
              px="6"
              _open={{ borderColor: "brand.violet" }}
              transition="all .25s"
            >
              <Accordion.ItemTrigger py="5" cursor="pointer">
                <Span flex="1" textAlign="start" fontFamily="heading" fontWeight="600" fontSize="md">
                  {f.q}
                </Span>
                <Accordion.ItemIndicator color="ink.500" />
              </Accordion.ItemTrigger>
              <Accordion.ItemContent>
                <Accordion.ItemBody pb="5" color="ink.500">
                  {f.a}
                </Accordion.ItemBody>
              </Accordion.ItemContent>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </Container>
    </Box>
  );
}
